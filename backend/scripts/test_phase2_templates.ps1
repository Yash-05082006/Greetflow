$ErrorActionPreference = 'Stop'

function Invoke-Json($uri, $method='GET', $body=$null) {
  if ($body) {
    return Invoke-RestMethod -Uri $uri -Method $method -ContentType 'application/json' -Body ($body | ConvertTo-Json -Compress -Depth 8)
  } else {
    return Invoke-RestMethod -Uri $uri -Method $method
  }
}

$base = 'http://localhost:4000'

# 1) List with filters (may be empty)
$list = Invoke-Json "$base/api/templates?type=birthday&age_group=18_plus"

# 2) Create template
$createBody = [pscustomobject]@{
  name = 'Test Template'
  type = 'birthday'
  age_group = '18_plus'
  html = '<div>Hello [Name]! [Message]</div>'
}
$create = Invoke-Json "$base/api/templates" 'POST' $createBody
$tid = $create.data.id

# 3) Get by id
$get = Invoke-Json "$base/api/templates/$tid"

# 4) Update
$updateBody = [pscustomobject]@{
  name = 'Updated Template'
  type = 'birthday'
  age_group = '18_plus'
  html = '<div>Hi [Name]! [Message]</div>'
}
$update = Invoke-Json "$base/api/templates/$tid" 'PUT' $updateBody

# 5) Preview
$preview = Invoke-Json "$base/api/templates/$tid/preview"

# 6) Delete
$delete = Invoke-Json "$base/api/templates/$tid" 'DELETE'

$result = [pscustomobject]@{
  list = $list
  create = $create
  get = $get
  update = $update
  preview = $preview
  delete = $delete
}

$result | ConvertTo-Json -Depth 8
