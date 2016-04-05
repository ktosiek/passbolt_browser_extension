# Change Log
All notable changes to this project will be documented in this file.
This project adheres to [Semantic Versioning](http://semver.org/).

## [Unreleased]

## [1.0.7] - 2016-04-04
### Fixed
- PASSBOLT-1158: Cleanup: remove useless console.log() from the code.
- PASSBOLT-1462: Remove spelling mistake on encrypting.

## [1.0.6] - 2016-03-28
### Fixed
- PASSBOLT-1424: Cleanup: in Firefox addon remove URL_PLUBLIC_REGISTRATION.
- PASSBOLT-1417: At the end of the setup, or in case of setup fatal error, setup data should be cleared.
- PASSBOLT-1359: Setup should restart where it was left.


## [1.0.5] - 2016-03-21
### Added
- PASSBOLT-1304: As a LU getting an Error500 when trying to authenticate I should see a retry button.
- PASSBOLT-1310: As user whose account is deleted I should get an appropriate feedback on login.

### Fixed
- PASSBOLT-1377: As LU I should be able to login again after my session timed out.
- PASSBOLT-1381: As LU I should not be able to share a password with a user who is registered but who has not completed his setup
- PASSBOLT-1418: The App worker should be attached only on private pages.

# Terminology
- AN: Anonymous user
- LU: Logged in user
- AP: User with plugin installed
- LU: Logged in user

[Unreleased]: https://github.com/passbolt/passbolt_firefox/compare/v1.0.6...HEAD
[1.0.6]: https://github.com/passbolt/passbolt_firefox/compare/v1.0.5...v1.0.6
[1.0.5]: https://github.com/passbolt/passbolt_firefox/compare/1.0.4...v1.0.5