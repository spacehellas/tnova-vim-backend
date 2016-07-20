# Building the T-NOVA VIM Monitoring Back-end Docker image

Official Docker images for the T-NOVA VIM Monitoring Back-end are available at
[Docker Hub](https://hub.docker.com/r/spacehellas/tnova-vim-backend/). If
anyone wishes to build the image personally, then please verify that you have
installed locally the necessary Node.js modules so that they are copied to the
Docker image.

## Steps to build a Docker image

```sh
git clone git@github.com:spacehellas/tnova-vim-backend.git # or clone your own fork
cd tnova-vim-backend
npm install
docker build --tag=tnova/vim-backend .
```


