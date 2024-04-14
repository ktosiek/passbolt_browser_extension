{
  inputs = {
    nixpkgs.url = "https://github.com/NixOS/nixpkgs/archive/e92039b55bcd58469325ded85d4f58dd5a4eaf58.tar.gz";
    dream2nix.url = "https://github.com/nix-community/dream2nix/archive/9ce00f86e96d958ac12d14c92531036e2f58297c.tar.gz";
  };

  outputs = inputs:
    let
      #__err = abort "nix develop nie zadziała: korzystamy z ";
      system = "x86_64-linux";
    in
    {
      packages.${system}.default = (import ./default.nix {
        sources = { };
        dream2nix = inputs.dream2nix;
        pkgs = inputs.nixpkgs.legacyPackages.${system};
      });
    };
}