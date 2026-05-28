import { google } from 'googleapis';

export async function appendToSheet(values: string[][], range: string = 'Sheet1!A1') {
    try {
        const scopes = ['https://www.googleapis.com/auth/spreadsheets'];
        const jwt = new google.auth.JWT(
            process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
            undefined,
            // Private key must be handled correctly for newlines in env vars
            process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, '\n'),
            scopes
        );

        const sheets = google.sheets({ version: 'v4', auth: jwt });

        // Spreadsheet ID should be in env
        let spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

        // Clean ID if user pasted full URL
        if (spreadsheetId?.includes('google.com')) {
            const matches = spreadsheetId.match(/\/d\/([a-zA-Z0-9-_]+)/);
            if (matches && matches[1]) {
                spreadsheetId = matches[1];
            }
        }

        if (!spreadsheetId) throw new Error("Missing Spreadsheet ID");

        const response = await sheets.spreadsheets.values.append({
            spreadsheetId,
            range: range,
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                values: values,
            },
        });

        return response.data;
    } catch (error) {
        console.error('Error appending to sheet:', error);
        throw error;
    }
}
