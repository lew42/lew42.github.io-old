# StrObj

Naming is such a bitch.  StringObject, StringList, just Str?

## Str extends StrObj

Str() will be a shorthand for auto-append.
Str({ one: "one", two: "two" }) will auto append, upgrading literals to StrObj (instead of assign);