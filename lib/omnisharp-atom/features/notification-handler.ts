var _ = require('lodash');
import Omni = require('../../omni-sharp-server/omni');
import {CompositeDisposable} from "rx";
import path = require('path');
import $ = require('jquery');

class NotificationHandler implements OmniSharp.IFeature {
    private disposable: Rx.CompositeDisposable;
    private packageRestoreNotification: PackageRestoreNotification;

    public activate() {
        this.disposable = new CompositeDisposable();

        this.packageRestoreNotification = new PackageRestoreNotification();

        this.disposable.add(Omni.listener.packageRestoreStarted.subscribe(this.packageRestoreNotification.handlePackageRestoreStarted));
        this.disposable.add(Omni.listener.packageRestoreFinished.subscribe(this.packageRestoreNotification.handlePackageRestoreFinished));
        this.disposable.add(Omni.listener.unresolvedDependencies.subscribe(this.packageRestoreNotification.handleUnresolvedDependencies));
        this.disposable.add(Omni.listener.events
            .where(z => z.Event === "log")
            .where(z => z.Body.Name === "OmniSharp.AspNet5.PackagesRestoreTool")
            .where(z => z.Body.Message.startsWith('Installing'))
            .subscribe(this.packageRestoreNotification.handleEvents));
    }

    public dispose() {
        this.disposable.dispose();
    }
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

    public handlePackageRestoreStarted = (event: OmniSharp.Models.PackageRestoreMessage) => {
        // Count how many of these we get so we know when to dismiss the notification
        this.packageRestoreStarted++;
        if (this.notification.isDismissed()) {
            this.notification.show('Package restore started', "Starting..");
        }
    }

    public handleUnresolvedDependencies = (event: OmniSharp.Models.UnresolvedDependenciesMessage) => {
        // Sometimes UnresolvedDependencies event is sent before PackageRestoreStarted
        if (this.notification.isDismissed()) {
            this.notification.show('Package restore started', "Starting..");
        }

        var projectName = this.findProjectNameFromFileName(event.FileName);
        // Client gets more than one of each UnresolvedDependencies events for each project
        // Don't show multiple instances of a project in the notification
        if (!_.any(this.knownProjects, (knownProject) => { return knownProject == projectName })) {
            this.knownProjects.push(projectName);
            this.notification.addDetail(`Unresolved dependencies for ${projectName}:`, true);
            if (event.UnresolvedDependencies) {
                event.UnresolvedDependencies.forEach(dep => {
                    this.notification.addDetail(` - ${dep.Name} ${dep.Version}`);
                });
            }
        }
    }

    public handlePackageRestoreFinished = (event: OmniSharp.Models.PackageRestoreMessage) => {
        // Count how many of these we get so we know when to dismiss the notification
        this.packageRestoreFinished++;
        if (this.packageRestoreStarted === this.packageRestoreFinished) {
            this.notification.setSuccessfulAndDismiss('Package restore finished.');
            this.packageRestoreStarted = 0;
            this.packageRestoreFinished = 0;
            this.knownProjects = [];
        }
    }

    public handleEvents = (event: OmniSharp.Stdio.Protocol.EventPacket) => {
        this.setPackageInstalled(event.Body.Message);
    }

    private findProjectNameFromFileName(fileName: string): string {
        var split = fileName.split(path.sep);
        var projectName = split[split.length - 2];
        return projectName;
    }

    private setPackageInstalled(message: string) {
        var match = message.match(/Installing ([a-zA-Z.]*) ([\D?\d?.?-?]*)/);
        var detailLines = this.notification.getDetailElement().children('.line');
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
        var details = this.getDetailElement();
        if (!detail) return;
        if (newline) details.append('<br />')
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
        var domNotification = $(atom.views.getView(this.atomNotification));
        domNotification.removeClass('info');
        domNotification.removeClass('icon-info');
        domNotification.addClass('success');
        domNotification.addClass('icon-check');
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
        return this.getFromDom($(atom.views.getView(this.atomNotification)), '.content .detail .detail-content');
    }

    private getFromDom(element: JQuery, selector: string): JQuery {
        var el = element[0];
        if (!el) return;
        var found = (<any> el).querySelectorAll(selector);
        return $(found[0]);
    }
}

export var notificationHandler = new NotificationHandler
