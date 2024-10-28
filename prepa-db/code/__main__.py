"""Create a airchivist initialization database.

For that purpose, it uses the original dataset object and the responses that
have been computed by the llm
"""

from __future__ import annotations

import ast
import logging
import re
from argparse import ArgumentParser, Namespace
from functools import partial
from pathlib import Path
from sqlite3 import connect
from typing import (
    Callable,
    Optional,
    TypeAlias,
)

import datasets as ds
import pandas as pd
from pydantic import ValidationError

from .model import (
    AppState,
    DocData,
    Generation,
    Message,
)

ToDocData: TypeAlias = Callable[[str], Optional[DocData]]
ToAppState: TypeAlias = Callable[[str, ToDocData, pd.Series], AppState]
AppStateMapper: TypeAlias = Callable[[pd.Series], AppState]
JsonMapper: TypeAlias = Callable[[pd.Series], str]

# Create and configure the global logger
LOGGER = logging.getLogger(__name__)


def cli() -> Namespace:
    """Process the cli arguments sys.argv."""
    parser = ArgumentParser(
        prog="db_prep",
        description="creates the airchivist database",
    )
    parser.add_argument(
        "-m",
        "--model",
        default="llama",
        choices=[
            "llama",
            "mistral7b",
            "mistralnemo",
        ],
    )
    parser.add_argument(
        "-p",
        "--prefix",
        default="./generated_texts",
        help="path where the generated texts have been saved",
    )
    return parser.parse_args()


def main() -> None:
    """Run the main entry point of the program."""
    logging.basicConfig(filename="execution.log", level=logging.INFO)

    args: Namespace = cli()
    mapper: JsonMapper = make_app_state_mapper(args)
    dataset: pd.DataFrame = get_dataset()
    dataset["labeling"] = dataset.apply(mapper, axis=1)
    save_to_database(args.model, dataset)


def make_app_state_mapper(args: Namespace) -> JsonMapper:
    """Process CLI arguments to create the appropriate mapping function.

    The retuned function is used to map one line of the dataset towards
    an ai-rchivist appstate (complete or not... should be complete).
    """
    match args.model:
        case "llama":
            prefix: str = f"{args.prefix}/llama3.1-8b"
            func: ToDocData = llama31
        case "mistral7b":
            prefix = f"{args.prefix}/mistral-7b"
            func = mistral
        case "mistralnemo":
            prefix = f"{args.prefix}/mistral-nemo"
            func = mistral

    appstate: AppStateMapper = partial(to_app_state, prefix, func)
    jsonmapper: JsonMapper = lambda x: appstate(x).model_dump_json(indent=4)  # noqa: E731
    return jsonmapper


def llama31(fname: str) -> DocData | None:
    """Process the content of a file produced by llama3.1 generation.

    Returns an airchivist app state (or none if the appstate could not be
    computed)
    """
    try:
        text: str = Path(fname).read_text(encoding="utf8")
        response: list = ast.literal_eval(text)
        generation: Generation = Generation.model_validate(response[0])
        assistant: Message = generation.generated_text[2]
    except ValidationError:
        LOGGER.exception("[LLAMA] validation error in %s", fname)
        return None
    except SyntaxError:
        LOGGER.exception("[LLAMA] syntax error in %s", fname)
        return None
    else:
        return assistant.app_state


def mistral(fname: str) -> DocData | None:
    """Process the content of a file produced by mistral-7b generation.

    Returns an airchivist app state (or none if the appstate could not be
    computed)
    """
    text: str = Path(fname).read_text(encoding="utf8")
    expr: re.Pattern = re.compile(
        r"message=AssistantMessage\(content='(?P<content>.*)', tool_calls",
        flags=re.DOTALL,
    )
    match: re.Match | None = expr.search(text)
    if match:
        content: str = match.group("content").replace("\\n", "\n")
        try:
            return DocData.model_validate(ast.literal_eval(content))
        except ValidationError:
            LOGGER.exception("[MISTRAL] validation error in %s", fname)
        except SyntaxError:
            LOGGER.exception("[MISTRAL] syntax error in %s", fname)
    return None


def get_dataset() -> pd.DataFrame:
    """Return a dataframe with the complete dataset we want to process."""
    # Initial computation is actually needed
    dataset: ds.DatasetDict = ds.load_dataset(
        "arch-be/brabant-xvii",
        name="doc_by_doc",
    )
    # get all 3 shards of the original dataset
    train: pd.DataFrame = dataset["train"].to_pandas()
    test: pd.DataFrame = dataset["test"].to_pandas()
    valid: pd.DataFrame = dataset["valid"].to_pandas()
    # insert additional 'subset' column
    train["subset"] = "train"
    test["subset"] = "test"
    valid["subset"] = "valid"
    # combine all subsets into one big dataframe
    df: pd.DataFrame = pd.concat(
        [train, test, valid],
        axis="index",
        ignore_index=True,
    )
    # append the utility columns (will be used to actually carry the labeling out)
    df["validated"] = False
    df["labeling"] = None
    # add some metadata to the index and columns for efficient hdf5 serialization
    df.index.name = "id"
    df.subset = df.subset.astype("category")
    df.project = df.project.astype("category")
    df.file_id = df.file_id.astype(str)
    df.text = df.text.astype(str)
    return df


def to_app_state(
    prefix: str,
    to_docdata: ToDocData,
    row: pd.Series,
) -> AppState:
    """Convert the given row to an app state.

    To resolve the llm response, it uses the prefix path to identify
    the folder where responses have been generated.
    """
    identifier: int = int(row.name)
    document: str = row["text"]

    fname: str = f'{prefix}/{row["project"]}_{row["file_id"]}'
    docdata: DocData | None = to_docdata(fname)
    prompt: str = Path("prompt.txt").read_text(encoding="utf8")

    if docdata:
        conversation: list[Message] = [
            Message(role="system", content=prompt),
            Message(role="user", content=document),
            Message(
                role="assistant",
                content=docdata.model_dump_json(indent=2),
            ),
        ]
    else:
        conversation = [
            Message(role="system", content=prompt),
            Message(role="user", content=document),
        ]

    app_state: AppState = AppState(
        id=identifier,
        document=document,
        documentdata=docdata,
        conversation=conversation,
    )
    return app_state


def save_to_database(
    model: str,  # the name of the model (mistral7b, mistralnemo, llama31)
    dataset: pd.DataFrame,  # the dataset we want to save to databae
) -> None:
    """Save the prepared dataset to a valid database."""
    path: Path = Path(f"databases/{model}.db")
    with connect(path) as conn:
        dataset.to_sql("dataset", conn, if_exists="replace")


if __name__ == "__main__":
    main()
