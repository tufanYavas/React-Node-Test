import ExcelJS from 'exceljs';

export const commonUtils = {
    convertJsonToCsvOrExcel: async ({ jsonArray, csvColumns, fileName, extension }) => {
        const csvHeader = csvColumns?.length > 0 && csvColumns?.map((col) => col?.Header);

        if (extension === 'csv') {
            // CSV için basit dönüşüm
            const csvContent = [
                csvHeader,
                ...jsonArray?.map((row) => csvColumns?.length > 0 && csvColumns?.map((col) => row[col?.accessor]))
            ].map(row => row.join(',')).join('\n');
            
            // CSV dosyasını indir
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.setAttribute('download', `${fileName}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } else if (extension === 'xlsx') {
            // Excel için exceljs kullan
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Sheet 1');
            
            // Başlık satırını ekle
            worksheet.addRow(csvHeader);
            
            // Veri satırlarını ekle
            jsonArray?.forEach(row => {
                const rowData = csvColumns?.length > 0 && csvColumns?.map((col) => row[col?.accessor]);
                worksheet.addRow(rowData);
            });
            
            // Excel dosyasını indir
            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.setAttribute('download', `${fileName}.xlsx`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }
}