{ pkgs ? import (builtins.fetchTarball (builtins.fromJSON (builtins.readFile ./nixpkgs.lock.json))) { } }:
with pkgs;
mkShell {
  name = "probot-auto-merge";
  buildInputs = builtins.map (name: builtins.getAttr name pkgs) (builtins.fromJSON (builtins.readFile ./pkgs.json));
}
