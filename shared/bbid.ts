export function bbid(name: string) {
    let result = 0;
    const uppercaseName = name.toUpperCase();
    for (let i = 0; i < uppercaseName.length; i++) {
        result += uppercaseName.charCodeAt(i) * i * 32479;
    }
    return result % 65535;
}