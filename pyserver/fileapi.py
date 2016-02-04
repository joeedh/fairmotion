ROOT_PARENT_ID = 1
EMPTY_TAG = "__(empty)__"

#might as well use google's mime type for folders
FOLDER_MIME = "application/vnd.google-apps.folder"

file_restricted_fields = set(["diskpath", "cached_path", "flag"])

import config;

mod = None
if config.serv_local:
  import fileapi_local as mod
else:
  import fileapi_db as mod

g = globals()
for k in dir(mod):
  if k[0] == "_": continue
  g[k] = getattr(mod, k)

