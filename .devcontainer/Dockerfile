FROM mcr.microsoft.com/vscode/devcontainers/typescript-node:0-14
ARG USERNAME=node
ARG USER_UID=1000
ARG USER_GID=$USER_UID

RUN groupmod --gid $USER_GID $USERNAME \
    && usermod --uid $USER_UID --gid $USER_GID $USERNAME \
    && chown -R $USER_UID:$USER_GID /home/$USERNAME

RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
    && apt-get install git
