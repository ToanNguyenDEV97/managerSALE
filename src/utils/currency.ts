// src/utils/currency.ts

const MANG_SO = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];
const MANG_HANG = ['', 'nghìn', 'triệu', 'tỷ', 'nghìn tỷ', 'triệu tỷ'];

function docBaSo(tr: number, ch: number, dv: number) {
    let ketQua = '';
    if (tr === undefined) return '';
    ketQua += MANG_SO[tr] + ' trăm';
    if (ch === 0 && dv === 0) return ketQua;
    if (ch === 0 && dv !== 0) {
        ketQua += ' linh ' + MANG_SO[dv];
        return ketQua;
    }
    if (ch === 1) {
        ketQua += ' mười';
        if (dv === 1) ketQua += ' một';
        else if (dv === 5) ketQua += ' lăm';
        else if (dv !== 0) ketQua += ' ' + MANG_SO[dv];
        return ketQua;
    }
    ketQua += ' ' + MANG_SO[ch] + ' mươi';
    if (dv === 1) ketQua += ' mốt';
    else if (dv === 5) ketQua += ' lăm';
    else if (dv !== 0) ketQua += ' ' + MANG_SO[dv];
    return ketQua;
}

export const readMoneyToText = (so: number): string => {
    if (!so || so === 0) return 'Không đồng';
    let prefix = "";
    if (so < 0) { so = Math.abs(so); prefix = "Âm "; }
    
    let str = so.toString();
    while (str.length % 3 !== 0) str = '0' + str;
    
    const groups = str.match(/.{1,3}/g);
    if (!groups) return 'Không đồng';
    
    let ketQua = '';
    const totalGroups = groups.length;
    
    for (let i = 0; i < totalGroups; i++) {
        const groupStr = groups[i];
        const tr = parseInt(groupStr[0]);
        const ch = parseInt(groupStr[1]);
        const dv = parseInt(groupStr[2]);
        if (tr === 0 && ch === 0 && dv === 0) continue;
        
        let strDoc = docBaSo(tr, ch, dv);
        if (i === 0 && totalGroups > 1 && tr === 0) {
             if (strDoc.startsWith('không trăm linh ')) strDoc = strDoc.replace('không trăm linh ', '');
             else if (strDoc.startsWith('không trăm ')) strDoc = strDoc.replace('không trăm ', '');
        }
        ketQua += ' ' + strDoc + ' ' + MANG_HANG[totalGroups - 1 - i];
    }
    
    ketQua = ketQua.trim().replace(/\s+/g, ' ');
    const final = prefix + ketQua.charAt(0).toUpperCase() + ketQua.slice(1);
    return final + ' đồng';
};