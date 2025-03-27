"""The models to use in order to validate the llm interactions within the scope of airchivist."""

from __future__ import annotations

from pydantic import BaseModel


class ChatRequest(BaseModel):
    """The kind of request sent by the front end when it wants to interact with the llm."""

    model: str
    conversation: list[Message]


class InitialRequest(BaseModel):
    """A request sent by the frontend to request that a document be analyzed by the llm."""

    model: str
    document: str


class InitialResponse(BaseModel):
    """The response to an InitialRequest sent by the front end."""

    documentdata: DocData
    conversation: list[Message]


class Message(BaseModel):
    """A single message in an llm conversation."""

    role: str
    content: str

class AppState(BaseModel):
    """The airchivist application state.

    Incidentally, this is the type of the object stored in the 'labeling'
    field of the database.
    """

    id: int
    model: str | None = None
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


class RandomId(BaseModel):
    """The identifier of a random document."""

    id: int


class Progression(BaseModel):
    """The progression of the copus labeling."""

    done: int
    full: int
