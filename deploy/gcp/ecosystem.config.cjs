/** PM2 process file — run from repo root on the VM */
module.exports = {
  apps: [
    {
      name: "mobilare-web",
      cwd: "./web",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3000",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
    },
  ],
};
