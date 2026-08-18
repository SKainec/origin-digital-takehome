from typing import Annotated

from pydantic import AfterValidator, BaseModel, ConfigDict, EmailStr

# Lowercased whole, not just the domain: RFC 5321 calls the local part case-sensitive but
# no real provider treats it that way, and two spellings of one address would otherwise be
# two registrants holding two seats at the same event.
Email = Annotated[EmailStr, AfterValidator(str.lower)]


class RegistrationRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    email: Email


class RegistrationResponse(BaseModel):
    email: str
