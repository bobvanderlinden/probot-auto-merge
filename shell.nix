{ pkgs ? import <nixpkgs> { } }:
with pkgs;
stdenv.mkDerivation {
  name = "probot-auto-merge";
  buildInputs = [ heroku nodejs-10_x python ];
}
