/**
 * Main App.
 *
 * @copyright (c) 2020 Passbolt SA
 * @licence GNU Affero General Public License http://www.gnu.org/licenses/agpl-3.0.en.html
 */

var passbolt = passbolt || {};

/* ==================================================================================
 *  Common page helpers
 * ================================================================================== */

// Notify the passbolt page that a process is currently running on the plugin.
// When the process is completed, the event
// passbolt.passbolt-page.loading should be fired.
passbolt.message.on('passbolt.passbolt-page.loading', function () {
  passbolt.message.emitToPage('passbolt_loading');
});

// Notify the passbolt page that a process has been completed on the plugin.
passbolt.message.on('passbolt.passbolt-page.loading_complete', function () {
  passbolt.message.emitToPage('passbolt_loading_complete');
});

// Add a css class to an html element
passbolt.message.on('passbolt.passbolt-page.add-class', function (selector, cssClass) {
  $(selector).addClass(cssClass);
});

// Remove a css class to an html element
passbolt.message.on('passbolt.passbolt-page.remove-class', function (selector, cssClass) {
  $(selector).removeClass(cssClass);
});

// Ask the passbolt page to release its focus
passbolt.message.on('passbolt.passbolt-page.remove-all-focuses', function () {
  passbolt.message.emitToPage('remove_all_focuses');
});

// Ask the passbolt page to resize an iframe
passbolt.message.on('passbolt.passbolt-page.resize-iframe', function (selector, dimension) {
  if (typeof dimension.height !== 'undefined') {
    $(selector).css('height', dimension.height);
  }
  if (typeof dimension.width !== 'undefined') {
    $(selector).css('width', dimension.width);
  }
});

// The passbolt application has been resized, when it happens the application
// emit a message to the plugin to notify it.
// @todo the plugin should check when the window is resized by itself.
window.addEventListener('passbolt.html_helper.window_resized', function (event) {
  var cssClasses = $('body').attr('class').split(' ');
  passbolt.message.emit('passbolt.app.window-resized', cssClasses);
});

// The passbolt application updated the settings
// Notify the extension to update
window.addEventListener('passbolt.plugin.account_settings_updated', function (event) {
  passbolt.request('passbolt.user.settings.sync');
});

/* ==================================================================================
 *  Group edit
 * ================================================================================== */

// Listen to plugin when a user has been added through the user edit iframe.
passbolt.message.on('passbolt.group.edit.add-user', function (groupUser) {
  passbolt.request('passbolt.group.edit.get_group_users_change_list')
    .then(function (changeList) {
      var change = {
        type: 'created',
        groupUser: groupUser,
        changeList: changeList
      };
      passbolt.message.emitToPage('passbolt.plugin.group.edit.group_users_updated', change);
      passbolt.message.emitToPage('passbolt.group.edit.add_user', groupUser);
    });

});

// Listen to page when a group_user is deleted, the group_user should be listed again in the autocomplete.
window.addEventListener('passbolt.group.edit.remove_group_user', function (event) {
  var data = event.detail,
    groupUser = data.groupUser;

  passbolt.request('passbolt.group.edit.remove-group_user', groupUser)
    .then(function (groupUser) {
      passbolt.request('passbolt.group.edit.get_group_users_change_list')
        .then(function (changeList) {
          var change = {
            type: 'deleted',
            groupUser: groupUser,
            changeList: changeList
          };
          passbolt.message.emitToPage('passbolt.plugin.group.edit.group_users_updated', change);
        });
    });
});

// A group_user is deleted, the group_user should be listed again in the autocomplete.
window.addEventListener('passbolt.group.edit.edit_group_user', function (event) {
  var data = event.detail,
    groupUser = data.groupUser;

  passbolt.request('passbolt.group.edit.edit-group_user', groupUser)
    .then(function (groupUser) {
      passbolt.request('passbolt.group.edit.get_group_users_change_list')
        .then(function (changeList) {
          var change = {
            type: 'updated',
            groupUser: groupUser,
            changeList: changeList
          };
          passbolt.message.emitToPage('passbolt.plugin.group.edit.group_users_updated', change);
        });
    });
});

// When a group is loaded during an edit operation.
// Typically, this happens during the edit phase. We then need to inform
// the client that a group has been loaded, so it can refresh the information.
passbolt.message.on('passbolt.group.edit.group_loaded', function (group) {
  passbolt.message.emitToPage('passbolt.plugin.group.edit.group_loaded', group);
});

// A group is saved.
window.addEventListener('passbolt.group.edit.save', function (event) {
  var data = event.detail,
    group = data.group;

  // Notify the share dialog about this change
  passbolt.request('passbolt.group.edit.save', group).then(
    function (groupSaved) {
      passbolt.message.emitToPage('group_edit_save_success', groupSaved);
    },
    function (error) {
      const data = passbolt.message.formatErrorAsPassboltAPIResponse(error);
      passbolt.message.emitToPage('group_edit_save_error', data);
    });
});

/* ==================================================================================
 *  Auth event
 * ================================================================================== */

window.addEventListener('passbolt.plugin.auth.logout', async function (event) {
  const requestId = event.detail[0];

  try {
    await passbolt.request('passbolt.auth.logout');
    passbolt.message.emitToPage(requestId, { status: 'SUCCESS' });
  } catch (error) {
    passbolt.message.emitToPage(requestId, { status: 'ERROR', body: error });
  }
});

/* ==================================================================================
 *  Storage update events
 * ================================================================================== */

// Listen when the resources local storage is updated and trigger an event on the page.
browser.storage.onChanged.addListener(changes => {
  if (changes.resources) {
    const resources = changes.resources.newValue;
    passbolt.message.emitToPage("passbolt.storage.resources.updated", resources);
  }
});

// Listen when the folder local storage is updated and trigger an event on the page.
browser.storage.onChanged.addListener(changes => {
  if (changes.folders) {
    const folders = changes.folders.newValue;
    passbolt.message.emitToPage("passbolt.storage.folders.updated", folders);
  }
});

/* ==================================================================================
 *  Resource event
 * ================================================================================== */

// Find all the resources
window.addEventListener('passbolt.storage.resources.get', async function (event) {
  const requestId = event.detail[0];
  const { resources } = await browser.storage.local.get(["resources"]);
  if (resources && Array.isArray(resources)) {
    passbolt.message.emitToPage(requestId, { status: "SUCCESS", body: resources });
  } else {
    passbolt.message.emitToPage(requestId, { status: "ERROR", error: { message: "The resources local storage is not initialized" } });
  }
});

// Find all the resources
window.addEventListener('passbolt.plugin.resources.delete-all', async function (event) {
  const requestId = event.detail[0];
  const resourcesIds = event.detail[1];

  try {
    await passbolt.request('passbolt.resources.delete-all', resourcesIds);
    passbolt.message.emitToPage(requestId, { status: 'SUCCESS' });
  } catch (error) {
    passbolt.message.emitToPage(requestId, { status: 'ERROR', body: error });
  }
});

// Update a resource
window.addEventListener('passbolt.plugin.resources.update', async function (event) {
  const requestId = event.detail[0];
  const resource = event.detail[1];

  try {
    const resourceUpdated = await passbolt.request('passbolt.resources.update', resource);
    passbolt.message.emitToPage(requestId, { status: 'SUCCESS', body: resourceUpdated });
  } catch (error) {
    passbolt.message.emitToPage(requestId, { status: 'ERROR', body: error });
  }
});

// Update the resources local storage.
window.addEventListener('passbolt.plugin.resources.update-local-storage', async function (event) {
  const requestId = event.detail[0];

  try {
    await passbolt.request('passbolt.resources.update-local-storage');
    passbolt.message.emitToPage(requestId, { status: 'SUCCESS' });
  } catch (error) {
    passbolt.message.emitToPage(requestId, { status: 'ERROR', body: error });
  }
});


/* ==================================================================================
 *  Favorite events
 * ================================================================================== */

// Update resources local storage
window.addEventListener('passbolt.plugin.favorite.add', async function (event) {
  const requestId = event.detail[0];
  const resourceId = event.detail[1];
  try {
    const favorite = await passbolt.request('passbolt.favorite.add', resourceId);
    passbolt.message.emitToPage(requestId, { status: 'SUCCESS', body: favorite });
  } catch (error) {
    passbolt.message.emitToPage(requestId, { status: 'ERROR', body: error });
  }
});

window.addEventListener('passbolt.plugin.favorite.delete', async function (event) {
  const requestId = event.detail[0];
  const resourceId = event.detail[1];
  try {
    await passbolt.request('passbolt.favorite.delete', resourceId);
    passbolt.message.emitToPage(requestId, { status: 'SUCCESS' });
  } catch (error) {
    passbolt.message.emitToPage(requestId, { status: 'ERROR', body: error });
  }
});

/* ==================================================================================
 * Import / export actions
 * ================================================================================== */

// The import is complete, we want to filter the workspace based on the tag used.
passbolt.message.on('passbolt.import-passwords.complete', function (results) {
  passbolt.message.emitToPage('passbolt.plugin.import-passwords-complete', { 'tag': results.importTag });
});

// The export is complete, we want to display a notification
passbolt.message.on('passbolt.export-passwords.complete', function () {
  passbolt.message.emitToPage('passbolt_notify', { status: 'success', title: 'export_passwords_success' });
});

/* ==================================================================================
 * Application (Legacy appjs)
 * ================================================================================== */
// Save a resource
// @deprecated with v2.7.0 will be removed with v3.x
window.addEventListener('passbolt.plugin.resources.save', async function (event) {
  console.error('@deprecated passbolt.plugin.resources.save - please upgrade.')
});

// The application asks the plugin to decrypt an armored string
// and store it in the clipboard.
// @deprecated since v2.7 will be removed in v3.x
window.addEventListener('passbolt.secret.decrypt', function (event) {
  var armoredSecret = event.detail;
  passbolt.message.emit('passbolt.passbolt-page.remove-all-focuses');
  passbolt.request('passbolt.app.deprecated.decrypt-copy', armoredSecret)
    .then(
      function success() {
        passbolt.message.emitToPage('passbolt_notify', {
          status: 'success',
          title: 'plugin_clipboard_copy_success',
          data: 'secret'
        });
      },
      function error(msg) {
        passbolt.message.emitToPage('passbolt_notify', { status: 'error', title: 'secret_decrypt_error' });
      });
});

// The application asks the plugin to decrypt and copy a secret
// and store it in the clipboard.
window.addEventListener('passbolt.plugin.decrypt_secret_and_copy_to_clipboard', async function (event) {
  var resourceId = event.detail;
  passbolt.message.emit('passbolt.passbolt-page.remove-all-focuses');
  try {
    await passbolt.request('passbolt.app.decrypt-secret-and-copy-to-clipboard', resourceId);
    passbolt.message.emitToPage('passbolt_notify', { status: 'success', title: 'plugin_clipboard_copy_success', data: 'secret' });
  } catch (error) {
    const data = {
      title: 'secret_decrypt_error',
      data: {
        message: error.message
      },
      status: 'error'
    };
    passbolt.message.emitToPage('passbolt_notify', data);
  }
});

// Listen when the user requests a backup of their private key.
window.addEventListener('passbolt.settings.download_private_key', function () {
  passbolt.request('passbolt.keyring.private.get')
    .then(function (key) {
      return passbolt.request('passbolt.keyring.key.backup', key.key, 'passbolt_private.asc');
    })
    .then(function () {
      passbolt.message.emitToPage('passbolt_notify', { status: 'success', title: 'download_private_key_success' });
    }, function () {
      passbolt.message.emitToPage('passbolt_notify', { status: 'error', title: 'download_private_key_error' });
    });
});

// Listen when the user requests a backup of their public key.
window.addEventListener('passbolt.settings.download_public_key', function () {
  passbolt.request('passbolt.keyring.public.get_armored')
    .then(function (publicKeyArmored) {
      return passbolt.request('passbolt.keyring.key.backup', publicKeyArmored, 'passbolt_public.asc')
    })
    .then(function () {
      passbolt.message.emitToPage('passbolt_notify', { status: 'success', title: 'download_public_key_success' });
    }, function () {
      passbolt.message.emitToPage('passbolt_notify', { status: 'error', title: 'download_public_key_error' });
    });
});


// Listen when the user requests an export of passwords.
// @deprecated with v2.7.0 will be removed with v3.x
window.addEventListener('passbolt.export-passwords', async function (evt) {
  var resources = evt.detail.resources;
  if (resources && resources.length) {
    const resourcesIds = resources.reduce((carry, resource) => [...carry, resource.id], []);
    await passbolt.request('passbolt.app.export-resources', resourcesIds)
  }
});

// Listen when the user requests an export of passwords.
window.addEventListener('passbolt.plugin.export_resources', async function (evt) {
  var resourcesIds = evt.detail;
  await passbolt.request('passbolt.app.export-resources', resourcesIds)
});

// Listen when the user requests an import of passwords.
window.addEventListener('passbolt.import-passwords', function (evt) {
  passbolt.request('passbolt.import-passwords.open-dialog');
});

// Listen when the appjs requests the authenticated status.
window.addEventListener('passbolt.auth.is-authenticated', async function (event) {
  const requestId = event.detail[0];
  const options = event.detail[1];

  try {
    const isAuthenticated = await passbolt.request('passbolt.auth.is-authenticated', options);
    passbolt.message.emitToPage(requestId, { status: 'SUCCESS', body: isAuthenticated });
  } catch (error) {
    console.error(error);
    passbolt.message.emitToPage(requestId, { status: 'ERROR', body: error });
  }
});

// result must be structured-clonable data
undefined;