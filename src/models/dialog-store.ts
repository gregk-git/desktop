import { ipcRenderer, remote } from 'electron';
import { observable, computed } from 'mobx';
import { getTheme } from '~/utils/themes';
import { ISettings } from '~/interfaces';
import { DEFAULT_SETTINGS } from '~/constants';

export class DialogStore {
  @observable
  public settings: ISettings = DEFAULT_SETTINGS;

  @computed
  public get theme() {
    return getTheme(this.settings.theme);
  }

  private _windowId = -1;

  @observable
  public visible = false;

  public firstTime = false;

  public constructor(
    options: {
      hideOnBlur?: boolean;
      visibilityWrapper?: boolean;
    } = {},
  ) {
    const { visibilityWrapper, hideOnBlur } = {
      hideOnBlur: true,
      visibilityWrapper: true,
      ...options,
    };
    if (visibilityWrapper) {
      ipcRenderer.on('visible', async (e, flag, ...args) => {
        if (!this.firstTime) {
          requestAnimationFrame(() => {
            this.visible = true;

            setTimeout(() => {
              this.visible = false;

              setTimeout(() => {
                this.onVisibilityChange(flag, ...args);
              }, 20);
            }, 20);
          });
          this.firstTime = true;
        } else {
          this.onVisibilityChange(flag, ...args);
        }
      });
    }

    if (hideOnBlur) {
      window.addEventListener('blur', () => {
        this.hide();
      });
    }

    ipcRenderer.send('get-settings');

    ipcRenderer.on('update-settings', (e, settings: ISettings) => {
      this.settings = { ...this.settings, ...settings };
    });
  }

  public get id() {
    return remote.getCurrentWebContents().id;
  }

  public get windowId() {
    if (this._windowId === -1) {
      const win = remote.getCurrentWindow();
      if (win) this._windowId = win.id;
    }

    return this._windowId;
  }

  public onVisibilityChange(visible: boolean, ...args: any[]) {}

  public hide(data: any = null) {
    if (this.visible) {
      this.visible = false;
      this.onHide(data);
      setTimeout(() => {
        ipcRenderer.send(`hide-${this.id}`);
      });
    }
  }

  public onHide(data: any = null) {}
}
