# Markdown Edit

Markdown Edit library for makdan.

It uses vanila JS.

## Components

- DOMContext
	- It will be attached to some div container (with content-editable)
  - It takes events from DOM (content-editable) and document
	  - Refine them for Engine
		- Event become a list of `insert`, `delete`, `select`, etc.
	- After sent event, it wait the response of the engine, and update DOM
	  - Using virtual DOM and diff & merge
- Engine
  - Engine takes event and provide updated DOM
	- Every events sent to revision repository, and revision repository give updates to md blocks.
- RevisionRepo
	- It contains every revisions
- LocalRevisionRepo
	- History & revisions in local
- RemoteRevisionRepo
	- History & revisions from BE server.
