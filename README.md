# blog-api

## notes

- probably refactor comments to use posts/:id/comments etc
- change to patch for update?
- Remove todos
- how to send better error for unique constraint violation
- add limit to results
- change cors crap once done
- refresh token stuff
- clearing cookies

## FORMS

- use multipart form when uploading images or nested data.
  - use multer to parse multipart form data
  - new FormData(formElement);
- simple text -> application/x-www-form-urlencoded
- json -> application/json
  - default -> uses body parser
  - new URLSearchParams(new FormData(formElement));
