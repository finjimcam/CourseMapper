### What does this MR do and why?

<!-- Describe in detail what your merge request does and why.

Please keep this description updated with any discussion that takes place so
that reviewers can understand your intent. Keeping the description updated is
especially important if they didn't participate in the discussion.
-->

%{first_multiline_commit}

### References
<!-- Please include cross links to any resources that are relevant to this MR.

This will give reviewers and future readers helpful context to give an efficient review of the changes introduced. 

If no references exist, delete this heading.
-->

- 

### MR acceptance checklist

<!-- To be filled out by the assignee before submitting for review. The purpose of this checklist is to let the reviewers know at a glane what the assignee believes is complete and what they believe still needs work or would like input on, and act as a guideline for review as well as initial development. -->

- [ ] This MR actually solves the problem it was meant to solve.
- [ ] It does so in the most appropriate way. 
- [ ] It satisfies all requirements. 
- [ ] There are no remaining bugs, logical problems, uncovered edge cases, or known vulnerabilities. 
- [ ] For the code that this change impacts, you believe that the automated tests validate functionality that is highly important to the user. If the existing automated tests do not cover the above functionality, you have added the necessary additional tests or added an issue to describe the automation testing gap and linked it to this MR. 
- [ ] This MR has been validated, and the method for validation and evidence are included in this MR.
- [ ] The This MR does not harm performance, or you have asked a reviewer to help assess the performance impact.

### Screenshots or screen recordings

<!-- Screenshots are required for UI changes, and strongly recommended for all other merge requests if they create a visible change on the site.

Please include any relevant screenshots or screen recordings that will assist
reviewers and future readers.
-->

| Before | After  |
| ------ | ------ |
|        |        |

<!-- OPTIONAL:
Use this table when providing screenshots at relevant viewport sizes.
Delete table rows that are not relevant to your changes.

| Viewport size   | Before     | After      |
| ----------------| ---------- | ---------- |
| `xs` (<576px)   |            |            |
| `sm` (>=576px)  |            |            |
| `md` (>=768px)  |            |            |
| `lg` (>=992px)  |            |            |
| `xl` (>=1200px) |            |            |
-->

### How to set up and validate locally

<!-- Numbered steps to set up and validate the change are strongly suggested.

Example below:

1. Update dependencies:
   ```bash
   pip install -r backend/requirements.txt
   ```
2. Run the population script:
    ```bash
    python backend/models/population.py
    ```
3. Run the backend server:
    ```bash
    fastapi dev backend/main.py
    ```
4. Navigate on the local instance of the site to /users/, /courses/, /permissions-groups/, or any other of the new get requests added in this MR. You will see raw json of the data in the related table.
-->

/assign me
