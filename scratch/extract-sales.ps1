$connectionString = "Server=.;Database=CRM;Integrated Security=True;"
$query = @"
SELECT 
  S.ID as form_id, 
  P.name as customer_name, 
  S.invoice_date_selling as date, 
  I.name as item_name, 
  D.price_item as selling_price, 
  D.discount_item as discount, 
  D.number_item as quantity 
FROM tbl_invoice_selling S 
LEFT JOIN tbl_personal P ON S.id_seller = P.ID 
JOIN tbl_invoice_selling_details D ON S.ID = D.id_invoice_selling 
LEFT JOIN tbl_ItemIntroduce I ON D.id_item = I.ID
"@

$connection = New-Object System.Data.SqlClient.SqlConnection($connectionString)
$command = New-Object System.Data.SqlClient.SqlCommand($query, $connection)

$connection.Open()
$reader = $command.ExecuteReader()

$results = @()
while ($reader.Read()) {
    $row = @{
        form_id = $reader["form_id"]
        customer_name = $reader["customer_name"]
        date = $reader["date"]
        item_name = $reader["item_name"]
        selling_price = $reader["selling_price"]
        discount = $reader["discount"]
        quantity = $reader["quantity"]
    }
    $results += $row
}

$connection.Close()

$results | ConvertTo-Json -Depth 10 | Out-File -FilePath "C:\Users\Click\.gemini\antigravity\scratch\all_sales.json" -Encoding UTF8
Write-Host "Data exported successfully!"
