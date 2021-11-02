function is_validt_email(validateString){
    const emailRegex = "([A-Za-z]*?@{1}[A-Za-z]*\\.{1}(com|dk))";
    return {
        email: validateString,
        validt: emailRegex.test(String(validateString).toLowerCase())
    }
}

exports.is_validt_email = is_validt_email;