package main

import (
	"archive/tar"
	"bytes"
	"context"
	"io"
	"io/ioutil"
	"os"

	"github.com/docker/docker/api/types"
	"github.com/docker/docker/api/types/container"
	"github.com/docker/docker/api/types/filters"
	"github.com/docker/docker/api/types/mount"
	"github.com/docker/docker/api/types/network"
	"github.com/docker/docker/client"
	"github.com/docker/go-connections/nat"
	libDatabox "github.com/me-box/lib-go-databox"
)

func StartSDK(defaultRegistry string, databoxVersion string) {

	redis()
	mongo()
	mockDatasource()
	databoxsdk(defaultRegistry, databoxVersion)
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

func databoxsdk(defaultRegistry string, databoxVersion string) {
	ctx := context.Background()

	config := &container.Config{
		Image:  "tlodge/databox-sdk",
		Labels: map[string]string{"databox.sdk": "sdk"},
		Env: []string{
			"DATABOX_VERSION=" + databoxVersion,
			"DATABOX_DEFAULT_REGISTRY=" + defaultRegistry,
		},
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
		Mounts: []mount.Mount{
			mount.Mount{
				Type:   mount.TypeBind,
				Source: "/var/run/docker.sock",
				Target: "/var/run/docker.sock",
			},
			mount.Mount{
				Source: "sdk-conf",
				Target: "/usr/src/app/conf",
				Type:   "volume",
			},
			mount.Mount{
				Source: "container-manager-certs",
				Target: "/usr/src/app/certs",
				Type:   "volume",
			},
		},
	}

	removeContainer("databox-sdk")
	pullImage(config.Image, &libDatabox.ContainerManagerOptions{DefaultRegistry: "tlodge", DefaultRegistryHost: "docker.io"})

	containerCreateCreatedBody, ccErr := dockerCli.ContainerCreate(ctx, config, hostConfig, &network.NetworkingConfig{}, "databox-sdk")
	libDatabox.ChkErrFatal(ccErr)

	f, _ := os.Open("/certs/containerManagerPub.crt")
	CopyFileToContainer("/run/secrets/DATABOX_ROOT_CA", f, containerCreateCreatedBody.ID)
	f.Close()

	dockerCli.ContainerStart(ctx, containerCreateCreatedBody.ID, types.ContainerStartOptions{})

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

// CopyFileToContainer copies a single file of any format to the target container
func CopyFileToContainer(targetFullPath string, fileReader io.Reader, containerID string) error {

	ctx := context.Background()
	cli, _ := client.NewEnvClient()

	fileBody, _ := ioutil.ReadAll(fileReader)

	var tarBuf bytes.Buffer
	tw := tar.NewWriter(&tarBuf)
	hdr := &tar.Header{
		Name: targetFullPath,
		Mode: 0660,
		Size: int64(len(fileBody)),
	}
	if err := tw.WriteHeader(hdr); err != nil {
		return err
	}
	if _, err := tw.Write(fileBody); err != err {
		return err
	}

	var r io.Reader
	r = &tarBuf
	err := cli.CopyToContainer(ctx, containerID, "/", r, types.CopyToContainerOptions{})
	if err != nil {
		return err
	}
	return nil
}
