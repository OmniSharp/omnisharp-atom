import {Models, Stdio} from "omnisharp-client";
import _ from "lodash";
import {Omni} from "../server/omni";
import {CompositeDisposable} from "omnisharp-client";
import * as path from "path";
const $ : JQueryStatic = require("jquery");

class NotificationHandler implements IFeature {
    private disposable: CompositeDisposable;
    private packageRestoreNotification: PackageRestoreNotification;

    public activate() {
        this.disposable = new CompositeDisposable();

        this.packageRestoreNotification = new PackageRestoreNotification();

        this.disposable.add(Omni.listener.packageRestoreStarted.subscribe(e =>
            this.packageRestoreNotification.handlePackageRestoreStarted(e)));

        this.disposable.add(Omni.listener.packageRestoreFinished.subscribe(e =>
            this.packageRestoreNotification.handlePackageRestoreFinished(e)));

        this.disposable.add(Omni.listener.unresolvedDependencies.subscribe(e =>
            this.packageRestoreNotification.handleUnresolvedDependencies(e)));

        this.disposable.add(Omni.listener.events
            .filter(z => z.Event === "log")
            .filter(z => _.includes(z.Body.Name, "PackagesRestoreTool"))
            .filter(z => z.Body.Message.startsWith("Installing"))
            .subscribe(e => this.packageRestoreNotification.handleEvents(e)));
    }

    public dispose() {
        this.disposable.dispose();
    }

    public required = true;
    public title = "Package Restore Notifications";
    public description = "Adds support to show package restore progress, when the server initiates a restore operation.";
}

class PackageRestoreNotification {
    constructor() {
        this.notification = new OmniNotification();
        this.packageRestoreStarted = 0;
        this.packageRestoreFinished = 0;
        this.knownProjects = [];
    }

    private notification: OmniNotification;
    private packageRestoreStarted: number;
    private packageRestoreFinished: number;
    private knownProjects: Array<string>;

    public handlePackageRestoreStarted = (event: Models.PackageRestoreMessage) => {
        // Count how many of these we get so we know when to dismiss the notification
        this.packageRestoreStarted++;
        if (this.notification.isDismissed()) {
            this.notification.show("Package restore started", "Starting..");
        }
    };

    public handleUnresolvedDependencies = (event: Models.UnresolvedDependenciesMessage) => {
        // Sometimes UnresolvedDependencies event is sent before PackageRestoreStarted
        if (this.notification.isDismissed()) {
            this.notification.show("Package restore started", "Starting..");
        }

        const projectName = this.findProjectNameFromFileName(event.FileName);
        // Client gets more than one of each UnresolvedDependencies events for each project
        // Don"t show multiple instances of a project in the notification
        if (!_.some(this.knownProjects, (knownProject) => { return knownProject === projectName; })) {
            this.knownProjects.push(projectName);
            this.notification.addDetail(`Unresolved dependencies for ${projectName}:`, true);
            if (event.UnresolvedDependencies) {
                event.UnresolvedDependencies.forEach(dep => {
                    this.notification.addDetail(` - ${dep.Name} ${dep.Version}`);
                });
            }
        }
    };

    public handlePackageRestoreFinished = (event: Models.PackageRestoreMessage) => {
        // Count how many of these we get so we know when to dismiss the notification
        this.packageRestoreFinished++;
        if (this.packageRestoreStarted === this.packageRestoreFinished) {
            this.notification.setSuccessfulAndDismiss("Package restore finished.");
            this.packageRestoreStarted = 0;
            this.packageRestoreFinished = 0;
            this.knownProjects = [];
        }
    };

    public handleEvents = (event: Stdio.Protocol.EventPacket) => {
        this.setPackageInstalled(event.Body.Message);
    };

    private findProjectNameFromFileName(fileName: string): string {
        const split = fileName.split(path.sep);
        const projectName = split[split.length - 2];
        return projectName;
    }

    private setPackageInstalled(message: string) {
        const match = message.match(/Installing ([a-zA-Z.]*) ([\D?\d?.?-?]*)/);
        const detailLines = this.notification.getDetailElement().children(".line");
        if (!match || match.length < 3) return;
        _.forEach(detailLines, line => {
            if (line.textContent.startsWith(` - ${match[1]} `)) {
                line.textContent = `Installed ${match[1]} ${match[2]}`;
            }
        });
    }
}

class OmniNotification {
    constructor() {
        this.dismissed = true;
    }

    private atomNotification: Atom.Notification;
    private dismissed: boolean;
    private isBeingDismissed: boolean;

    public addDetail(detail: string, newline?: boolean) {
        const details = this.getDetailElement();
        if (!detail) return;
        if (newline) details.append("<br />");
        details.append(`<div class="line">${detail}</div>`);
    }

    public show(message: string, detail: string) {
        this.atomNotification = atom.notifications.addInfo(message, { detail: detail, dismissable: true });
        this.dismissed = false;
        this.atomNotification.onDidDismiss(notification => {
            this.dismissed = true;
            this.isBeingDismissed = false;
        });
    }

    public setSuccessfulAndDismiss(message: string) {
        if (this.isBeingDismissed) return;
        this.addDetail(message, true);
        const domNotification = $(atom.views.getView(this.atomNotification));
        domNotification.removeClass("info");
        domNotification.removeClass("icon-info");
        domNotification.addClass("success");
        domNotification.addClass("icon-check");
        this.isBeingDismissed = true;
        setTimeout(() => { this.dismiss(); }, 2000);
    }

    public isDismissed(): boolean {
        return this.dismissed;
    }

    private dismiss() {
        this.atomNotification.dismiss();
    }

    public getDetailElement(): JQuery {
        return this.getFromDom($(atom.views.getView(this.atomNotification)), ".content .detail .detail-content");
    }

    private getFromDom(element: JQuery, selector: string): JQuery {
        const el = element[0];
        if (!el) return;
        const found = (<any>el).querySelectorAll(selector);
        return $(found[0]);
    }
}

export const notificationHandler = new NotificationHandler;
