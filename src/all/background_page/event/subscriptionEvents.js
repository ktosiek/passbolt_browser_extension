/**
 * Subscription events
 *
 * Used to handle the events related to the current subscription
 *
 * Passbolt ~ Open source password manager for teams
 * Copyright (c) Passbolt SA (https://www.passbolt.com)
 *
 * Licensed under GNU Affero General Public License version 3 of the or any later version.
 * For full copyright and license information, please see the LICENSE.txt
 * Redistributions of files must retain the above copyright notice.
 *
 * @copyright     Copyright (c) Passbolt SA (https://www.passbolt.com)
 * @license       https://opensource.org/licenses/AGPL-3.0 AGPL License
 * @link          https://www.passbolt.com Passbolt(tm)
 */
import SubscriptionController from "../controller/subscription/subscriptionController";

/**
 * Listens the subscription events
 * @param {Worker} worker
 * @param {ApiClientOptions} apiClientOptions the api client options
 */
const listen = function(worker, apiClientOptions) {
  /*
   * Find the subscription
   *
   * @listens passbolt.subscription.get
   * @param requestId {uuid} The request identifier
   */
  worker.port.on('passbolt.subscription.get', async requestId => {
    const subscriptionController = new SubscriptionController(worker, apiClientOptions);
    try {
      const subscriptionEntity = await subscriptionController.getSubscription();
      worker.port.emit(requestId, 'SUCCESS', subscriptionEntity);
    } catch (error) {
      worker.port.emit(requestId, 'ERROR', error);
    }
  });

  /*
   * Update the subscription key
   *
   * @listens passbolt.subscription.get
   * @param requestId {uuid} The request identifier
   */
  worker.port.on('passbolt.subscription.update', async(requestId, subscriptionKeyDto) => {
    const subscriptionController = new SubscriptionController(worker, apiClientOptions);
    try {
      const subscriptionEntity = await subscriptionController.updateSubscription(subscriptionKeyDto);
      worker.port.emit(requestId, 'SUCCESS', subscriptionEntity);
    } catch (error) {
      worker.port.emit(requestId, 'ERROR', error);
    }
  });
};
export const SubscriptionEvents = {listen};
