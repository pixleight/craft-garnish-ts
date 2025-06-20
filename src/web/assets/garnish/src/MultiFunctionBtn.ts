import Garnish from './Garnish';
import Base from './Base';
import {
  MultiFunctionBtnInterface,
  MultiFunctionBtnSettings,
  JQueryElement,
} from './types';
import $ from 'jquery';

/**
 * Multi-Function Button
 */
export default Base.extend(
  {
    $btn: null as JQueryElement | null,
    $btnLabel: null as JQueryElement | null,
    $liveRegion: null as JQueryElement | null,

    defaultMessage: null as string | null,
    busyMessage: null as string | null,
    failureMessage: null as string | null,
    retryMessage: null as string | null,
    successMessage: null as string | null,

    init: function (
      button: string | HTMLElement | JQueryElement,
      settings?: MultiFunctionBtnSettings
    ): void {
      this.setSettings(settings, Garnish.MultiFunctionBtn.defaults);
      this.$btn = $(button);

      // Is this already a multi-function button?
      if (this.$btn.data('multifunction-btn')) {
        console.warn(
          'Double-instantiating a multi-function button on an element'
        );
        this.$btn.data('multifunction-btn').destroy();
      }

      this.$btnLabel = this.$btn.find('.label');
      this.defaultMessage = this.$btnLabel.text();

      if (this.$btn.prev().attr('role') === 'status') {
        this.$liveRegion = this.$btn.prev();
      } else {
        this.$liveRegion = $('<div/>', {
          class: 'visually-hidden',
          role: 'status',
        });
        this.$btn.before(this.$liveRegion);
      }

      this.busyMessage = this.$btn.data('busy-message')
        ? this.$btn.data('busy-message')
        : (Craft as any).t('app', 'Loading');
      this.failureMessage = this.$btn.data('failure-message');
      this.retryMessage = this.$btn.data('retry-message');
      this.successMessage = this.$btn.data('success-message')
        ? this.$btn.data('success-message')
        : (Craft as any).t('app', 'Success');
    },

    busyEvent: function (): void {
      this.$btn!.addClass(this.settings.busyClass);

      if (this.busyMessage) {
        this.updateMessages(this.busyMessage);
      }
    },

    failureEvent: function (): void {
      this.endBusyState();

      if (!this.failureMessage && !this.retryMessage) return;

      if (this.failureMessage) {
        this.updateMessages(this.failureMessage);
      }

      if (this.retryMessage) {
        // If there was a failure message, ensure there's a delay before showing retry message
        if (this.failureMessage) {
          setTimeout(() => {
            this.updateMessages(this.retryMessage!);
          }, this.settings.failureMessageDuration);
        } else {
          this.updateMessages(this.retryMessage);
        }
      }
    },

    successEvent: function (): void {
      this.endBusyState();

      if (this.successMessage) {
        this.updateMessages(this.successMessage);
      }
    },

    updateMessages: function (message: string): void {
      this.$liveRegion!.text(message);

      if (this.settings.changeButtonText) {
        this.$btnLabel!.text(message);
      }

      // Empty live region so a SR user navigating with virtual cursor doesn't find outdated message
      setTimeout(() => {
        // Bail out if there's now a different message in the live region
        if (this.$liveRegion!.text() !== message) return;

        this.$liveRegion!.empty();
      }, this.settings.clearLiveRegionTimeout);
    },

    endBusyState: function (): void {
      this.$btn!.removeClass(this.settings.busyClass);
    },

    destroy: function (): void {
      this.$btn!.removeData('multifunction-btn');
      this.base();
    },
  } as MultiFunctionBtnInterface,
  {
    defaults: {
      busyClass: 'loading',
      clearLiveRegionTimeout: 2500,
      failureMessageDuration: 3000,
      changeButtonText: false,
    } as MultiFunctionBtnSettings,
  }
);
