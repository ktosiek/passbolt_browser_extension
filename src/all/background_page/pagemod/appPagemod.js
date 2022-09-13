/**
 * React application pagemod.
 *
 * @copyright (c) 2020 Passbolt SA
 * @licence GNU Affero General Public License http://www.gnu.org/licenses/agpl-3.0.en.html
 */
import GpgAuth from "../model/gpgauth";
import {Worker} from "../model/worker";
import GetLegacyAccountService from "../service/account/getLegacyAccountService";
import {App as app} from "../app";
import PageMod from "../sdk/page-mod";
import AppInitController from "../controller/app/appInitController";


/*
 * This pagemod help bootstrap the passbolt application from a passbolt server app page
 */
const App = function() {};
App._pageMod = null;

App.init = function() {
  if (App._pageMod) {
    App._pageMod.destroy();
    App._pageMod = null;
  }

  App._pageMod = new PageMod({
    name: 'App',
    include: 'about:blank?passbolt=passbolt-iframe-app',
    contentScriptWhen: 'end',
    contentScriptFile: [
      /*
       * Warning: script and styles need to be modified in
       * chrome/data/passbolt-iframe-app.html
       */
    ],
    onAttach: async function(worker) {
      const auth = new GpgAuth();
      if (!await auth.isAuthenticated() || await auth.isMfaRequired()) {
        console.error('Can not attach application if user is not logged in.');
        return;
      }

      // Init the application.
      const appInitController = new AppInitController();
      await appInitController.main();

      /*
       * Retrieve the account associated with this worker.
       * @todo This method comes to replace the User.getInstance().get().
       */
      let account;
      try {
        account = await GetLegacyAccountService.get();
      } catch (error) {
        /*
         * Ensure the application does not crash completely if the legacy account cannot be retrieved.
         * The following controllers won't work as expected:
         * - AccountRecoverySaveUserSettingsController
         * - ReviewRequestController
         */
        console.error('appPagemod::attach legacy account cannot be retrieved, please contact your administrator.');
        console.error(error);
      }

      app.events.appBootstrap.listen(worker);

      // Initialize the events listeners.
      app.events.app.listen(worker, account);
      app.events.auth.listen(worker);
      app.events.clipboard.listen(worker);
      app.events.config.listen(worker);
      app.events.folder.listen(worker);
      app.events.resource.listen(worker);
      app.events.resourceType.listen(worker);
      app.events.role.listen(worker);
      app.events.keyring.listen(worker);
      app.events.secret.listen(worker);
      app.events.organizationSettings.listen(worker);
      app.events.share.listen(worker);
      app.events.subscription.listen(worker);
      app.events.user.listen(worker);
      app.events.group.listen(worker);
      app.events.comment.listen(worker);
      app.events.tag.listen(worker);
      app.events.favorite.listen(worker);
      app.events.importResources.listen(worker);
      app.events.exportResources.listen(worker);
      app.events.actionLogs.listen(worker);
      app.events.multiFactorAuthentication.listen(worker);
      app.events.theme.listen(worker);
      app.events.locale.listen(worker);
      app.events.passwordGenerator.listen(worker);
      app.events.mobile.listen(worker);

      // Keep the pagemod event listeners at the end of the list.
      app.events.pagemod.listen(worker);

      Worker.add('App', worker);
    }
  });
};

export const AppPagemod = App;
