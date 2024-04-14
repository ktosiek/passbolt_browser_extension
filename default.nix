{ sources ? import ./nix/sources.nix
, dream2nix ? import sources.dream2nix
, pkgs ? import sources.nixpkgs { overlays = [ ]; config = { }; }
}:
dream2nix.lib.evalModules {
  packageSets.nixpkgs = pkgs;
  modules = [
    ({ lib, config, dream2nix, ... }:
      let packageJson = builtins.fromJSON (builtins.readFile ./package.json);
      in
      {
        inherit (packageJson) name version;

        imports = [
          dream2nix.modules.dream2nix.nodejs-package-lock
          dream2nix.modules.dream2nix.nodejs-granular
        ];

        nodejs-package-lock = {
          source = ./.;
        };

        nodejs-granular = {
          buildScript = ''
            patchShebangs --build node_modules/*/bin/
            grunt build-firefox
          '';
        };

        mkDerivation = {
          src = lib.cleanSource ./.;
          # nativeBuildInputs = [ pkgs.breakpointHook ];

          shellHook = ''
            PATH=${builtins.toString ./.}/node_modules/.bin:$PATH;

            if [ "$(cat package-lock.json)" != "$(cat node_modules/_package-lock.json 2>/dev/null)" ]; then
              npm install && \
              cp package-lock.json node_modules/_package-lock.json
            fi

            echo "Build: grunt build-firefox  # generuje dist/firefox/passbolt-*.zip"
          '';
        };

      })
  ];
}