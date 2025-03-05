## Overview
This folder comprises the backend code for LISU CCM @UofG.

## Code Structure
The source code structure is given below:
```text
.
├── helpers.py
├── main.py
├── session.py
├── models
│   ├── __init__.py
│   ├── database.py
│   ├── models_base.py
│   ├── populate.py
│   └── test_populate.py
```
At the beginning of each source file is a description of its purpose. A brief overview is given:

The `main.py` file is the API layer of the backend, defining the interface by which it communicates with the frontend. The other root level files exist to serve the main file in that end. 

The source files within `models/` are responsible for the database logic.
