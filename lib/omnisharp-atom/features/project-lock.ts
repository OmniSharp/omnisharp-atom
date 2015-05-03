import path = require('path');
import OmniSharpServer = require('../../omni-sharp-server/omni-sharp-server');
import Omni = require('../../omni-sharp-server/omni');
import _ = require('lodash');
import ek = require('event-kit');
var glob = require('glob');
var pw = require('pathwatcher');

class ProjectLock {
  file: pw.File;
  private changed: ek.Disposable;
  private deleted: ek.Disposable;
  public isWatching: boolean;

  constructor(file: pw.File) {
    this.file = file;
    this.isWatching = false;
  }

  get filename(): string {
    return this.file.getBaseName();
  }

  public watch() {
    if (this.isWatching) return;

    this.changed = this.file.onDidChange(() => {
        if (!OmniSharpServer.vm.isOff) {
          Omni.filesChanged(this.filename)
          .catch(e => {
            console.error(e);
          });
        }
    });

    this.deleted = this.file.onDidDelete(() => {
      this.unwatch();
    });

    this.isWatching = true;
  }

  public unwatch() {
    this.dispose();
    this.isWatching = false;
  }

  public dispose() {
    this.changed.dispose();
    this.deleted.dispose();
  }
}


class FileMonitor {
  private disposables: ek.CompositeDisposable;
  private files: ProjectLock[];

  constructor() {
    this.disposables = new ek.CompositeDisposable();
    this.files = [];
  }

  public activate() {
      atom.emitter.on("omni-sharp-server:start", data => {
          this.monitor(data.path);
      });
  }

  public deactivate() {
    this.disposables.dispose();
    _.each(this.files, file => file.dispose());
    this.files = [];
  }


  public monitor(location: string) {
    glob(`${location}/**/*/project.json`, (er, files) => {
        files.push(`${location}/project.json`);

        _.each(files, (file, index) => {

            var dirname = path.dirname(file.toString());
            var filename = dirname + path.sep + "project.lock.json";

            if (_.findIndex(this.files, f => f.filename === filename) === -1) {

                var file = new pw.File(filename);

                file.exists()
                  .then(exists => {
                      if (exists) {
                          var filelock = new ProjectLock(file);
                          filelock.watch();
                          this.files.push(filelock);
                      }
                  });
            }

        });

    });
  }

};

export = FileMonitor;
