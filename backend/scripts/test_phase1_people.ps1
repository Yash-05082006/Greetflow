$ErrorActionPreference = 'Stop'

function Invoke-Json($uri, $method='GET', $body=$null) {
  if ($body) {
    return Invoke-RestMethod -Uri $uri -Method $method -ContentType 'application/json' -Body ($body | ConvertTo-Json -Compress -Depth 8)
  } else {
    return Invoke-RestMethod -Uri $uri -Method $method
  }
}

$base = 'http://localhost:4000'

# 1) Health
$health = Invoke-Json "$base/health"

# 2) List
$list = Invoke-Json "$base/api/people?page=1&limit=5"

# 3) Create
$email = 'yash.' + [guid]::NewGuid().ToString().Substring(0,8) + '@example.com'
$createBody = [pscustomobject]@{
  first_name = 'Yash'
  last_name = 'Tester'
  email = $email
  consent_email = $true
  tags = @('developer','test')
}
$create = Invoke-Json "$base/api/people" 'POST' $createBody
$id = $create.data.id

# 4) Get by ID
$get = Invoke-Json "$base/api/people/$id"

# 5) Update
$updateBody = [pscustomobject]@{
  first_name = 'Updated'
  last_name = 'Tester'
  email = $email
  consent_email = $true
  tags = @('developer','test')
}
$update = Invoke-Json "$base/api/people/$id" 'PUT' $updateBody

# 6) Upcoming
$upcoming = Invoke-Json "$base/api/people/upcoming?days=30&type=birthday"

# 7) Delete
$delete = Invoke-Json "$base/api/people/$id" 'DELETE'

$result = [pscustomobject]@{
  health = $health
  list = $list
  create = $create
  get = $get
  update = $update
  upcoming = $upcoming
  delete = $delete
}

$result | ConvertTo-Json -Depth 8
