# CRM Data Export - PowerShell ADO.NET (proper Unicode handling)
# Exports all CRM tables to JSON files with correct Kurdish text encoding

$ErrorActionPreference = "Stop"
$server = "LAPTOP-AR5R5DVK"
$database = "CRM"
$outputDir = "d:\bedart-management\crm_export"

# Ensure output directory exists
if (-not (Test-Path $outputDir)) { New-Item -ItemType Directory -Path $outputDir -Force | Out-Null }

function Invoke-SqlQuery {
    param([string]$Query)
    
    $connStr = "Server=$server;Database=$database;Trusted_Connection=True;"
    $conn = New-Object System.Data.SqlClient.SqlConnection($connStr)
    $conn.Open()
    
    $cmd = $conn.CreateCommand()
    $cmd.CommandText = $Query
    $cmd.CommandTimeout = 120
    
    $adapter = New-Object System.Data.SqlClient.SqlDataAdapter($cmd)
    $dataSet = New-Object System.Data.DataSet
    $adapter.Fill($dataSet) | Out-Null
    
    $conn.Close()
    
    $results = @()
    foreach ($row in $dataSet.Tables[0].Rows) {
        $obj = @{}
        foreach ($col in $dataSet.Tables[0].Columns) {
            $val = $row[$col.ColumnName]
            if ($val -is [System.DBNull]) {
                $obj[$col.ColumnName] = $null
            } elseif ($val -is [System.DateTime]) {
                $obj[$col.ColumnName] = $val.ToString("yyyy-MM-dd")
            } else {
                $obj[$col.ColumnName] = $val
            }
        }
        $results += $obj
    }
    return $results
}

Write-Host "Exporting CRM data with proper Unicode encoding..." -ForegroundColor Cyan

# 1. Items
Write-Host "  Exporting tbl_ItemIntroduce..." -NoNewline
$items = Invoke-SqlQuery "SELECT ID, name, Item_type, brand FROM tbl_ItemIntroduce"
$items | ConvertTo-Json -Depth 10 | Out-File "$outputDir\items.json" -Encoding utf8
Write-Host " $($items.Count) records" -ForegroundColor Green

# 2. Personal (customers + suppliers)  
Write-Host "  Exporting tbl_personal..." -NoNewline
$personal = Invoke-SqlQuery "SELECT ID, code, name, ph_number, address, name_oner_store, name_delegate, ph_number_delegate, type_personal, zone FROM tbl_personal"
$personal | ConvertTo-Json -Depth 10 | Out-File "$outputDir\personal.json" -Encoding utf8
Write-Host " $($personal.Count) records" -ForegroundColor Green

# 3. Expenses
Write-Host "  Exporting tbl_expense..." -NoNewline
$expenses = Invoke-SqlQuery "SELECT ID, expense_type, expense_detail, expense_price, money_type, date_time, expense_notice, code_store, expense_jor FROM tbl_expense"
$expenses | ConvertTo-Json -Depth 10 | Out-File "$outputDir\expenses.json" -Encoding utf8
Write-Host " $($expenses.Count) records" -ForegroundColor Green

# 4. Selling Invoices
Write-Host "  Exporting tbl_invoice_selling..." -NoNewline
$sellingInv = Invoke-SqlQuery "SELECT ID, invoice_number_selling, invoice_date_selling, id_seller, code_store, code_money_type, code_payment, discount_item, dolar_price, id_delegate, tebene FROM tbl_invoice_selling"
$sellingInv | ConvertTo-Json -Depth 10 | Out-File "$outputDir\selling_invoices.json" -Encoding utf8
Write-Host " $($sellingInv.Count) records" -ForegroundColor Green

# 5. Selling Details
Write-Host "  Exporting tbl_invoice_selling_details..." -NoNewline
$sellingDet = Invoke-SqlQuery "SELECT ID, id_invoice_selling, id_item, number_item, price_item, discount_item FROM tbl_invoice_selling_details"
$sellingDet | ConvertTo-Json -Depth 10 | Out-File "$outputDir\selling_details.json" -Encoding utf8
Write-Host " $($sellingDet.Count) records" -ForegroundColor Green

# 6. Buying Invoices
Write-Host "  Exporting tbl_invoice_buy..." -NoNewline
$buyingInv = Invoke-SqlQuery "SELECT ID, invoice_number, invoice_date, id_company, id_store, money_type, payment_type, dolar_price, invoice_number_compnay, tebene FROM tbl_invoice_buy"
$buyingInv | ConvertTo-Json -Depth 10 | Out-File "$outputDir\buying_invoices.json" -Encoding utf8
Write-Host " $($buyingInv.Count) records" -ForegroundColor Green

# 7. Buying Details
Write-Host "  Exporting Table_invoice_buy_details..." -NoNewline
$buyingDet = Invoke-SqlQuery "SELECT ID, id_invoice, id_item, number_item_one, price_buying_one, sales_one, sales_sum, transportation, type_money, id_sales_unit, expired_date FROM Table_invoice_buy_details"
$buyingDet | ConvertTo-Json -Depth 10 | Out-File "$outputDir\buying_details.json" -Encoding utf8
Write-Host " $($buyingDet.Count) records" -ForegroundColor Green

Write-Host "`nAll exports complete!" -ForegroundColor Cyan
Write-Host "Files saved to: $outputDir" -ForegroundColor Yellow
