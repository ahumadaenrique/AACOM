export async function appendToSheet(values: string[][], range: string = 'Sheet1!A1') {
    console.log("Mock appendToSheet called with range:", range, "and values:", values);
    return { success: true, mock: true };
}
