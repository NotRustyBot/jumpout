export type IncidentHandler = (e: any) => any;


export class IncidentRotuer {
    routes: Record<string, IncidentRotue> = {};
    subscribe<K extends string>(name: K, component: trippable<K>) {
        let route = this.routes[name];
        if (!route) {
            route = new IncidentRotue(name);
            this.routes[name] = route;
        }
        route.subscribe(component);
    }

    unsubscribe<K extends string>(name: K, component: trippable<K>) {
        const route = this.routes[name];
        if (route)
            route.unsubscribe(component);
    }

    fire(name: string, params?: any) {
        let route = this.routes[name];
        if (!route) {
            route = new IncidentRotue(name);
            this.routes[name] = route;
        }

        route.fire(params);
    }
}

export type trippable<T extends string> = Record<T, (params: any) => void>;
class IncidentRotue {
    name: string;
    subscribers = new Set<trippable<string>>();

    constructor(name: string) {
        this.name = name;
    }

    subscribe(component: trippable<string>) {
        this.subscribers.add(component);
    }

    unsubscribe(component: trippable<string>) {
        this.subscribers.delete(component);
    }

    fire(params: any) {
        for (const subscriber of this.subscribers) {
            subscriber[this.name](params);
        }
    }
}
