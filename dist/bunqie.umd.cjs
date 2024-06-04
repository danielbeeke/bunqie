(function(global, factory) {
  typeof exports === "object" && typeof module !== "undefined" ? factory(exports) : typeof define === "function" && define.amd ? define(["exports"], factory) : (global = typeof globalThis !== "undefined" ? globalThis : global || self, factory(global.bunqie = {}));
})(this, function(exports2) {
  "use strict";
  const memory = /* @__PURE__ */ new Map();
  const set = (key, value) => {
    memory.set(key, value);
  };
  const get = (key) => {
    return memory.get(key);
  };
  const createKeyPair = async (identifier) => {
    const options = {
      name: "RSASSA-PKCS1-v1_5",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: { name: "SHA-256" }
    };
    const keyPair = await globalThis.crypto.subtle.generateKey(options, true, ["sign", "verify"]);
    await set(identifier + ":client:private", keyPair.privateKey);
    await set(identifier + ":client:public", keyPair.publicKey);
    return keyPair;
  };
  const getKeyPair = async (identifier) => {
    const privateKey = await get(identifier + ":client:private");
    const publicKey = await get(identifier + ":client:public");
    return privateKey && publicKey ? { privateKey, publicKey } : void 0;
  };
  const publicKeyToPEM = async (publicKey) => {
    var _a;
    const exportedKey = await globalThis.crypto.subtle.exportKey("spki", publicKey);
    const body = btoa(String.fromCharCode(...new Uint8Array(exportedKey)));
    const cleanedBody = (_a = body.match(/.{1,64}/g)) == null ? void 0 : _a.join("\n");
    return `-----BEGIN PUBLIC KEY-----
${cleanedBody}
-----END PUBLIC KEY-----`;
  };
  const saveServerKeys = async (identifier, serverResponse) => {
    await set(identifier + ":server", serverResponse);
  };
  const getServerKeys = async (identifier) => {
    const data = await get(identifier + ":server");
    if (data)
      return data;
  };
  class Bunqy {
    constructor(context) {
      this.context = context;
    }
    async init() {
      let serverKeys = await getServerKeys(this.context.apiKey);
      try {
        await this.get("/installation", {
          headers: { "X-Bunq-Client-Authentication": serverKeys.Token.token }
        });
      } catch (error) {
        let keyPair = await getKeyPair(this.context.apiKey);
        if (!keyPair)
          keyPair = await createKeyPair(this.context.apiKey);
        const client_public_key = await publicKeyToPEM(keyPair.publicKey);
        serverKeys = await this.post("/installation", {}, { client_public_key });
        await saveServerKeys(this.context.apiKey, serverKeys);
        await this.post(
          "/device-server",
          {
            headers: { "X-Bunq-Client-Authentication": serverKeys.Token.token }
          },
          {
            description: "Bunqie",
            secret: this.context.apiKey,
            permitted_ips: ["*"]
          }
        );
      }
      const sessionData = await this.post(
        "/session-server",
        { headers: { "X-Bunq-Client-Authentication": serverKeys.Token.token } },
        { secret: this.context.apiKey }
      );
      if (sessionData.Token.token) {
        this.context.token = sessionData.Token.token;
      } else {
        throw new Error("Could not initiate session");
      }
    }
    async request(method, path, init = {}, body) {
      const lat = 5.3833993;
      const lng = 52.1562025;
      const mergedInit = Object.assign({
        method,
        headers: Object.assign(
          {
            "User-Agent": "Bunqie",
            "X-Bunq-Language": "nl_NL",
            "X-Bunq-Region": "nl_NL",
            "X-Bunq-Client-Request-Id": (/* @__PURE__ */ new Date()).toISOString(),
            "X-Bunq-Geolocation": `${lng} ${lat} 0 100 NL`
          },
          init.headers ?? {}
        )
      });
      if (body) {
        const keyPair = await getKeyPair(this.context.apiKey);
        const encoder = new TextEncoder();
        const encoded = encoder.encode(JSON.stringify(body));
        const signatureAsArrayBuffer = await window.crypto.subtle.sign("RSASSA-PKCS1-v1_5", keyPair.privateKey, encoded);
        const signature = btoa(String.fromCharCode(...new Uint8Array(signatureAsArrayBuffer)));
        mergedInit.headers["X-Bunq-Client-Signature"] = signature;
        mergedInit.body = JSON.stringify(body);
      }
      if (!mergedInit.headers["X-Bunq-Client-Authentication"] && this.context.token) {
        mergedInit.headers["X-Bunq-Client-Authentication"] = this.context.token;
      }
      const variableMatches = [...path.matchAll(/{(.*?)}/g)];
      let replacedPath = path;
      if (variableMatches.length) {
        for (const [token, name] of variableMatches) {
          if (!this.context[name])
            throw new Error(`Used the variable ${name} but it was not set in the context`);
          replacedPath = replacedPath.replaceAll(token, this.context[name]);
        }
      }
      const url = `https://public-api.sandbox.bunq.com/v1/${replacedPath}`;
      const response = await fetch(url, mergedInit);
      const output = await response.json();
      if (!output.Error) {
        if (Array.isArray(output.Response)) {
          return Object.assign({}, ...output.Response);
        }
        return output.Response;
      }
      console.error(output);
      throw new Error("Something went wrong");
    }
    async post(path, init = {}, body) {
      return this.request("post", path, init, body);
    }
    async get(path, init = {}, body) {
      return this.request("get", path, init, body);
    }
  }
  exports2.Bunqy = Bunqy;
  Object.defineProperty(exports2, Symbol.toStringTag, { value: "Module" });
});
