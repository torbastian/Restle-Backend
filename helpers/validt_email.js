
//laver et regex check for om string indeholder et @ og et .com eller .dk
//returnere et json object med string testet
//og true vis string indeholder ønskede characktere og false vis den ikke gør
function is_validt_email(validateString){
    const emailRegex = "([A-Za-z]*?@{1}[A-Za-z]*\\.{1}(com|dk))";
    return {
        email: validateString,
        validt: emailRegex.test(String(validateString).toLowerCase())
    }
}

exports.is_validt_email = is_validt_email;