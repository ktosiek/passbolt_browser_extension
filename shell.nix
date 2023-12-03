{ sources ? import ./nix/sources.nix
, pkgs ? import sources.nixpkgs { overlays = [] ; config = {}; } }:
  pkgs.mkShell {
    nativeBuildInputs = [
      pkgs.niv
      pkgs.nodejs_20
    ];

  shellHook = ''
    PATH=${builtins.toString ./.}/node_modules/.bin:$PATH;

    echo "Build: grunt build-firefox  # generuje dist/firefox/passbolt-*.zip"
  '';
}
