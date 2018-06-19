package main

import (
	"context"
	"path/filepath"

	"github.com/docker/docker/api/types"
	"github.com/docker/docker/api/types/container"
	"github.com/docker/docker/api/types/filters"
	"github.com/docker/docker/api/types/network"
	"github.com/docker/go-connections/nat"
	libDatabox "github.com/toshbrown/lib-go-databox"
)

func StartSDK() {

	redis()
	mongo()
	mockDatasource()
	databoxsdk()
	testserver()
}

func redis() {

	config := &container.Config{
		Image:  "tlodge/databox-redis:latest",
		Labels: map[string]string{"databox.sdk": "sdk"},
		ExposedPorts: nat.PortSet{
			"6379/tcp": {},
		},
	}

	removeContainer("redis")

	pullImage(config.Image, &libDatabox.ContainerManagerOptions{DefaultRegistry: "tlodge", DefaultRegistryHost: "docker.io"})

	containerCreateCreatedBody, ccErr := dockerCli.ContainerCreate(context.Background(), config, &container.HostConfig{}, &network.NetworkingConfig{}, "redis")
	libDatabox.ChkErrFatal(ccErr)

	dockerCli.ContainerStart(context.Background(), containerCreateCreatedBody.ID, types.ContainerStartOptions{})

}

func mongo() {
	config := &container.Config{
		Image:  "tlodge/mongo:latest",
		Labels: map[string]string{"databox.sdk": "sdk"},
		ExposedPorts: nat.PortSet{
			"27017/tcp": {},
		},
		Cmd: []string{"/usr/bin/mongod", "--dbpath", "/data/mongo", "--smallfiles"},
	}

	removeContainer("mongo")

	pullImage(config.Image, &libDatabox.ContainerManagerOptions{DefaultRegistry: "tlodge", DefaultRegistryHost: "docker.io"})

	containerCreateCreatedBody, ccErr := dockerCli.ContainerCreate(context.Background(), config, &container.HostConfig{}, &network.NetworkingConfig{}, "mongo")
	libDatabox.ChkErrFatal(ccErr)

	dockerCli.ContainerStart(context.Background(), containerCreateCreatedBody.ID, types.ContainerStartOptions{})
}

func mockDatasource() {

	config := &container.Config{
		Image:  "tlodge/databox-datasource-mock",
		Labels: map[string]string{"databox.sdk": "sdk"},
		Cmd:    []string{"node", "index.js"},
	}

	removeContainer("mock-datasource")
	pullImage(config.Image, &libDatabox.ContainerManagerOptions{DefaultRegistry: "tlodge", DefaultRegistryHost: "docker.io"})

	containerCreateCreatedBody, ccErr := dockerCli.ContainerCreate(context.Background(), config, &container.HostConfig{}, &network.NetworkingConfig{}, "mock-datasource")
	libDatabox.ChkErrFatal(ccErr)

	dockerCli.ContainerStart(context.Background(), containerCreateCreatedBody.ID, types.ContainerStartOptions{})

}

func databoxsdk() {

	settingsPath, _ := filepath.Abs("./sdk")
	certsPath, _ := filepath.Abs("./certs")

	config := &container.Config{
		Image:  "tlodge/databox-sdk",
		Labels: map[string]string{"databox.sdk": "sdk"},
		ExposedPorts: nat.PortSet{
			"8086/tcp": {},
		},
		Cmd: []string{"node", "index.js"},
	}

	hostConfig := &container.HostConfig{
		Links: []string{
			"redis",
			"mongo",
		},
		PortBindings: nat.PortMap{"8086/tcp": []nat.PortBinding{nat.PortBinding{HostIP: "0.0.0.0", HostPort: "8086/tcp"}}},
		Binds: []string{
			"/var/run/docker.sock:/var/run/docker.sock:rw",
			settingsPath + ":/usr/src/app/conf",
			certsPath + "containerManagerPub.crt:/run/secrets/DATABOX_ROOT_CA:rw",
		},
	}

	removeContainer("databox-sdk")
	pullImage(config.Image, &libDatabox.ContainerManagerOptions{DefaultRegistry: "tlodge", DefaultRegistryHost: "docker.io"})

	containerCreateCreatedBody, ccErr := dockerCli.ContainerCreate(context.Background(), config, hostConfig, &network.NetworkingConfig{}, "databox-sdk")
	libDatabox.ChkErrFatal(ccErr)

	dockerCli.ContainerStart(context.Background(), containerCreateCreatedBody.ID, types.ContainerStartOptions{})

}

func testserver() {

	config := &container.Config{
		Image:  "tlodge/databox-test-server",
		Labels: map[string]string{"databox.sdk": "sdk"},
		ExposedPorts: nat.PortSet{
			"8435/tcp": {},
			"9090/tcp": {},
		},
		Cmd: []string{"node", "index.js"},
	}

	hostConfig := &container.HostConfig{
		Links: []string{
			"redis",
			"mongo",
		},
		PortBindings: nat.PortMap{"9090/tcp": []nat.PortBinding{nat.PortBinding{HostIP: "0.0.0.0", HostPort: "9090/tcp"}}},
	}

	removeContainer("databox-test-server")

	pullImage(config.Image, &libDatabox.ContainerManagerOptions{DefaultRegistry: "tlodge", DefaultRegistryHost: "docker.io"})

	containerCreateCreatedBody, ccErr := dockerCli.ContainerCreate(context.Background(), config, hostConfig, &network.NetworkingConfig{}, "databox-test-server")
	libDatabox.ChkErrFatal(ccErr)

	dockerCli.ContainerStart(context.Background(), containerCreateCreatedBody.ID, types.ContainerStartOptions{})

}

func StopSDK() {

	filters := filters.NewArgs()
	filters.Add("label", "databox.sdk")

	containers, err := dockerCli.ContainerList(context.Background(), types.ContainerListOptions{Filters: filters})
	libDatabox.ChkErr(err)

	if len(containers) > 0 {
		for _, container := range containers {
			libDatabox.Info("Removing old databox container " + container.Image)
			err := dockerCli.ContainerStop(context.Background(), container.ID, nil)
			libDatabox.ChkErr(err)
		}
	}

}
