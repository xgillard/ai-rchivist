"""The models to use in order to validate the llm interactions within the scope of airchivist."""

from __future__ import annotations

import re

from pydantic import BaseModel, ValidationError


class Generation(BaseModel):
    """The ouput of a call to .generate() on some hf llm."""

    generated_text: list[Message]


class Message(BaseModel):
    """A single message in an llm conversation."""

    role: str
    content: str
    version: DocData | None = None

    @property
    def app_state(self) -> DocData | None:
        """Attempt to find the appstate in a llm response."""
        try:
            match: re.Match | None = re.search(
                r"```(json)?(?P<content>.*)```",
                self.content,
                flags=re.DOTALL,
            )
            text: str = match.group("content") if match else ""
            return DocData.model_validate_json(text)
        except ValidationError:
            return None


class AppState(BaseModel):
    """The airchivist application state.

    Incidentally, this is the type of the object stored in the 'labeling'
    field of the database.
    """

    id: int
    document: str
    documentdata: DocData | None
    conversation: list[Message]


class DocData(BaseModel):
    """The data related to a document that has been labeled by airchivist."""

    doctype: str
    act_date: str
    fact_date: str
    persons: list[Person]
    locations: list[Location]
    summary: Summary


class Person(BaseModel):
    """A person's information in airchivist."""

    firstname: str
    lastname: str
    role: str
    function: str


class Location(BaseModel):
    """The information about a location in airchivist."""

    name: str
    loctype: str


class Summary(BaseModel):
    """The text summary in airchivist."""

    en: str
    fr: str
    nl: str
    de: str
