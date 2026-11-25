import { tokenService } from "../src/modules/identity/services/token.service";

const userId = crypto.randomUUID();

const token = await tokenService.createAccessToken(userId);

console.log("User ID:", userId);
console.log("Access Token:");
console.log(token);

const verified = await tokenService.verifyAccessToken(token);

console.log("Token verified:", verified.sub === userId);
