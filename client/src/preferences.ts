const defaults = {
    autoReload: true,
    softReloadCss: true,
}


type preferencesObject = typeof defaults & Record<string, boolean | string>

export class DevPreferences {
    private static currentPreferences: preferencesObject = defaults;
    static controls: Record<string, HTMLInputElement> = {}
    static load() {
        for (const key in this.currentPreferences) {
            const stored = localStorage.getItem("dev-" + key);
            if (stored) {
                if (typeof this.currentPreferences[key] == "boolean") {
                    this.currentPreferences[key] = stored == "true";
                } else {
                    this.currentPreferences[key] = stored;
                }
            }
            this.createUIElement(key, this.currentPreferences[key]);
        }
    }

    static getPreferences() {
        return this.currentPreferences;
    }

    static updatePreference(key: string) {
        const element = this.controls[key];
        let value = "";
        if (typeof this.currentPreferences[key] == "boolean") {
            this.currentPreferences[key] = element.checked;
            value = element.checked ? "true" : "false";
        } else {
            this.currentPreferences[key] = element.value;
            value = element.value;
        }

        localStorage.setItem("dev-" + key, value);
    }

    static createUIElement(key: string, value: string | boolean) {
        const title = key.replace(/([A-Z])/g, " $1").toLocaleLowerCase();
        const menu = document.getElementById("dev-preferences-list") ?? (() => { throw new Error() })();
        const line = document.createElement("div");
        line.classList.add("dev-preference");
        const label = document.createElement("span");
        label.innerText = title;
        const element = document.createElement("input");
        if (typeof value == "boolean") {
            element.type = "checkbox";
            element.checked = value;
        } else {
            element.value = value;
        }

        element.addEventListener('input', () => {
            this.updatePreference(key);
        });

        this.controls[key] = element;


        line.appendChild(label);
        line.appendChild(element);
        menu.appendChild(line);
    }
}