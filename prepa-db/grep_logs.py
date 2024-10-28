"""cat execution.log | grep errors .."""

import re
from pathlib import Path


def main() -> None:
    """Run the main entry point of the program."""
    ex: re.Pattern = re.compile(r"ERROR:__main__:.*")
    with Path("execution.log").open("r", encoding="utf8") as logs:
        for line in logs:
            if ex.match(line):
                print(line, end="")  # noqa: T201


if __name__ == "__main__":
    main()
