import {
    hashPassword,
    verifyPassword,
    createSecurity,
} from "avss-lite-Raka503";

async function main() {
    console.log("\n=== AVSS LITE INTEGRATION TEST ===");

    const password = "AviCore-AVSS-SmokeTest-2026!";
    const hashedPassword = await hashPassword(password);

    const validPassword = await verifyPassword(
        password,
        hashedPassword
    );

    const invalidPassword = await verifyPassword(
        "Wrong-Password",
        hashedPassword
    );

    const security = createSecurity();

    const csrfToken = security.csrf.generateToken();

    const csrfValid = security.csrf.validateToken(
        csrfToken,
        csrfToken
    );

    const sanitized = security.xss.sanitize(
        "<script>alert('xss')</script>"
    );

    const headers = security.headers
        .builder()
        .withDefaults()
        .build();

    console.log("Argon2id hashing:", hashedPassword.length > 0);
    console.log("Password verification:", validPassword);
    console.log("Wrong password rejected:", !invalidPassword);
    console.log("CSRF token validation:", csrfValid);
    console.log("XSS sanitizer:", sanitized);
    console.log("Security headers:", Object.keys(headers).length);

    const results = [
        hashedPassword.length > 0,
        validPassword,
        !invalidPassword,
        csrfValid,
        Object.keys(headers).length > 0,
    ];

    const passed = results.filter(Boolean).length;

    console.log(`\nRESULT: ${passed}/${results.length} checks passed`);

    if (passed !== results.length) {
        process.exitCode = 1;
    }
}

main().catch((error) => {
    console.error("AVSS Lite test failed:", error);
    process.exitCode = 1;
});
