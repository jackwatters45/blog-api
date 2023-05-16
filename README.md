# blog-api

## notes

- how to send better error for unique constraint violation
- add limit to results
- how to save jwt token in cookie?
- change cors crap once done
- refresh token stuff

## FORMS

- use multipart form when uploading images or nested data.
  - use multer to parse multipart form data
  - new FormData(formElement);
- simple text -> application/x-www-form-urlencoded
- json -> application/json
  - default -> uses body parser
  - new URLSearchParams(new FormData(formElement));
