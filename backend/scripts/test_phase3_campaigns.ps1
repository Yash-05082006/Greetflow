$ErrorActionPreference = 'Stop'

function Invoke-Json($uri, $method='GET', $body=$null) {
  if ($body) {
    return Invoke-RestMethod -Uri $uri -Method $method -ContentType 'application/json' -Body ($body | ConvertTo-Json -Compress -Depth 8)
  } else {
    return Invoke-RestMethod -Uri $uri -Method $method
  }
}

$base = 'http://localhost:4000'

# Try to use an existing template; if none, create one
$tplList = Invoke-Json "$base/api/templates"
if ($tplList.success -and $tplList.data.Count -gt 0) {
  $tplId = $tplList.data[0].id
} else {
  $createTplBody = [pscustomobject]@{
    name = 'Campaign Test Template'
    type = 'birthday'
    age_group = '18_plus'
    html = '<div>Hello [Name]! [Message]</div>'
  }
  $tplCreate = Invoke-Json "$base/api/templates" 'POST' $createTplBody
  $tplId = $tplCreate.data.id
}

# 1) List campaigns (may be empty)
$list = Invoke-Json "$base/api/campaigns?status=draft"

# 2) Create campaign
$createBody = [pscustomobject]@{
  title = 'Test Campaign'
  type = 'greeting'
  template_id = $tplId
  audience_query = @{ tags = @('vip') }
  channel = 'gmail'
}
$create = Invoke-Json "$base/api/campaigns" 'POST' $createBody
$cid = $create.data.id

# 3) Get by id
$get = Invoke-Json "$base/api/campaigns/$cid"

# 4) Update
$updateBody = [pscustomobject]@{
  title = 'Updated Campaign'
  type = 'greeting'
  template_id = $tplId
  audience_query = @{ tags = @('vip') }
  channel = 'gmail'
}
$update = Invoke-Json "$base/api/campaigns/$cid" 'PUT' $updateBody

# 5) Send (simulate)
$send = Invoke-Json "$base/api/campaigns/$cid/send" 'POST'

# 6) Delete (cancel)
$delete = Invoke-Json "$base/api/campaigns/$cid" 'DELETE'

$result = [pscustomobject]@{
  template_fixture = @{ id = $tplId }
  list = $list
  create = $create
  get = $get
  update = $update
  send = $send
  delete = $delete
}

$result | ConvertTo-Json -Depth 8
