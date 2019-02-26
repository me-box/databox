package main

import (
	"context"
	"flag"
	"fmt"
	"io"
	"io/ioutil"
	"net"
	"net/http"
	"os"
	"runtime"
	"strings"
	"syscall"
	"time"

	"encoding/json"

	"github.com/docker/docker/api/types"
	"github.com/docker/docker/api/types/filters"
	"github.com/docker/docker/api/types/mount"
	"github.com/docker/docker/api/types/swarm"
	"github.com/docker/docker/client"
	libDatabox "github.com/me-box/lib-go-databox"
)

var path string
var dockerCli *client.Client

const certsBasePath = "./certs"
const CURRENT_RELEASE = "0.5.2"
const DEFAULT_REGISTRY = "databoxsystems"

func main() {

	DOCKER_API_VERSION := flag.String("API", "1.37", "Docker API version ")

	startCmd := flag.NewFlagSet("start", flag.ExitOnError)
	startCmdIP := startCmd.String("swarm-ip", "127.0.0.1", "The IP on the host to advertise the swarm.")
	startCmdRelease := startCmd.String("release", CURRENT_RELEASE, "Databox version to start, can uses tagged versions or latest")
	startCmdRegistryHosts := startCmd.String("registryHost", "docker.io", "Override the default registry host, server where images are pulled form")
	startCmdRegistry := startCmd.String("registry", DEFAULT_REGISTRY, "Override the default registry path, where images are pulled form")
	startCmdPassword := startCmd.String("password", "", "Override the password if you dont want an auto generated one. Mainly for testing")
	appStore := startCmd.String("manifestStore", "https://github.com/me-box/databox-manifest-store", "Override the default manifest store where manifests are loaded form (must be a repo on github)")
	cmImage := startCmd.String("cm", "databoxsystems/container-manager", "Override container-manager image")
	uiImage := startCmd.String("core-ui", "databoxsystems/core-ui", "Override core ui image")
	arbiterImage := startCmd.String("arbiter", "databoxsystems/arbiter", "Override arbiter image")
	coreNetworkImage := startCmd.String("core-network", "databoxsystems/core-network", "Override container-manager image")
	coreNetworkRelay := startCmd.String("core-network-relay", "databoxsystems/core-network-relay", "Override core-network-relay image")
	appServerImage := startCmd.String("app-server", "databoxsystems/driver-app-store", "Override local manifest driver image")
	exportServerImage := startCmd.String("export-service", "databoxsystems/export-service", "Override export-service image")
	storeImage := startCmd.String("store", "databoxsystems/core-store", "Override core-store image")
	clearSLAdb := startCmd.Bool("flushSLAs", false, "Removes any saved apps or drivers from the SLA database so they will not restart")
	enableLogging := startCmd.Bool("v", false, "Enables verbose logging of the container-manager")
	arch := startCmd.String("arch", "", "Used to override the detected cpu architecture only useful for testing arm64v8 support using docker for mac.")
	sslHostName := startCmd.String("sslHostName", "", "Used to override the detected HostName for use in ssl cert.")
	ReGenerateDataboxCertificates := startCmd.Bool("regenerateCerts", false, "Force databox to regenerate the databox root and certificate")
	DevMounts := startCmd.String("devmount", "", `Mount a App or driver ContSrcPath to a HostSrcPath for easier development. Format [{ContName:"some-container-name","ContSrcPath":"/src","HostSrcPath":"/some/path/on/host"},{ContName:"some-container-name","ContSrcPath":"/src","HostSrcPath":"/some/path/on/host"}]`)
	stopCmd := flag.NewFlagSet("stop", flag.ExitOnError)
	logsCmd := flag.NewFlagSet("logs", flag.ExitOnError)

	sdkCmd := flag.NewFlagSet("sdk", flag.ExitOnError)
	startSDK := sdkCmd.Bool("start", false, "Use this to start the databox sdk")
	sdkCmdRelease := sdkCmd.String("release", CURRENT_RELEASE, "Databox version to start, can uses tagged versions or latest")
	sdkCmdRegistry := sdkCmd.String("registry", DEFAULT_REGISTRY, "Override the default registry path, where images are pulled form")

	stopSDK := sdkCmd.Bool("stop", false, "Use this to stop the databox sdk")

	testCmd := flag.NewFlagSet("test", flag.ExitOnError)
	testCmdNetwork := testCmd.Bool("network", false, "Perform a network test")

	wipeCmd := flag.NewFlagSet("wipe", flag.ExitOnError)
	wipeCmdRemoveCerts := wipeCmd.Bool("removeCerts", false, "Force databox to remove the databox certificate")
	wipeCmdYes := wipeCmd.Bool("y", false, "Yes I'm sure")
	wipeCmdLeaveApps := wipeCmd.Bool("LeaveCmgrStore", false, "use this flag to if you will to wipe the data but leave the installed apps and driver the password will also remain unchanged")

	flag.Parse()

	os.Setenv("DOCKER_API_VERSION", *DOCKER_API_VERSION)
	dockerCli, _ = client.NewEnvClient()

	path = "" //this should not be set outside of a container use --host-path if needed

	if _, err := os.Stat("./certs"); err != nil {
		os.Mkdir("./certs", 0770)
	}
	if _, err := os.Stat("./slaStore"); err != nil {
		os.Mkdir("./slaStore", 0770)
	}

	if len(os.Args) == 1 {
		displayUsage()
		os.Exit(2)
	}

	switch os.Args[1] {
	case "start":
		startCmd.Parse(os.Args[2:])

		libDatabox.Info("Starting Databox " + *startCmdRelease)

		//get some info in the network configuration
		hostname, _ := os.Hostname()
		if *sslHostName != "" {
			hostname = *sslHostName
		}
		ipv4s := removeIPv6addresses(getLocalInterfaceIps())

		cpuArch := ""
		if *arch != "" {
			cpuArch = *arch
		} else if runtime.GOARCH == "amd64" {
			cpuArch = "amd64"
		} else if runtime.GOARCH == "arm64" {
			cpuArch = "arm64v8"
		} else {
			panic("Unsupported CPU architecture ")
		}

		opts := &libDatabox.ContainerManagerOptions{
			Version:               *startCmdRelease,
			SwarmAdvertiseAddress: *startCmdIP,
			ContainerManagerImage: *cmImage + "-" + cpuArch + ":" + *startCmdRelease,
			CoreUIImage:           *uiImage + "-" + cpuArch + ":" + *startCmdRelease,
			ArbiterImage:          *arbiterImage + "-" + cpuArch + ":" + *startCmdRelease,
			CoreNetworkImage:      *coreNetworkImage + "-" + cpuArch + ":" + *startCmdRelease,
			CoreNetworkRelayImage: *coreNetworkRelay + "-" + cpuArch + ":" + *startCmdRelease,
			AppServerImage:        *appServerImage + "-" + cpuArch + ":" + *startCmdRelease,
			ExportServiceImage:    *exportServerImage + "-" + cpuArch + ":" + *startCmdRelease,
			DefaultStoreImage:     *storeImage + "-" + cpuArch + ":" + *startCmdRelease,
			ClearSLAs:             *clearSLAdb,
			DefaultRegistryHost:   *startCmdRegistryHosts,
			DefaultRegistry:       *startCmdRegistry,
			DefaultAppStore:       *appStore,
			EnableDebugLogging:    *enableLogging,
			OverridePasword:       *startCmdPassword,
			InternalIPs:           ipv4s,
			Hostname:              hostname,
			Arch:                  cpuArch,
			DevMounts:             []libDatabox.DevMount{},
		}

		externalIP, err := getExternalIP()
		if err != nil {
			libDatabox.Warn("Could not get external IP address, do you have network connectivity? ")
			libDatabox.Warn("Try here for help https://development.robinwinslow.uk/2016/06/23/fix-docker-networking-dns/")
			libDatabox.Warn("Continuing as external connectivity is not always needed ;-)")
			opts.ExternalIP = ipv4s[0]
		} else {
			opts.ExternalIP = externalIP
		}

		if *ReGenerateDataboxCertificates == true {
			libDatabox.Info("Forcing regoration of Databox certificates")
			volume := listDockerVolumesMatching("container-manager-certs")
			removeVolumes(volume)
		}

		if *DevMounts != "" {
			//unmarshal and check DevMounts
			err := json.Unmarshal([]byte(*DevMounts), &opts.DevMounts)
			if err != nil {
				libDatabox.Err("Incorrectly formated devmount JSON object. " + err.Error())
				return
			}
			//do we have all the info
			for _, m := range opts.DevMounts {
				if m.HostSrcPath == "" || m.ContSrcPath == "" || m.ContName == "" {
					libDatabox.Err("Incorrectly formated devmount JSON object. ContName, HostSrcPath and ContSrcPath must be provided")
					return
				}
			}
			//does the HostSrcPath exist?
			for _, m := range opts.DevMounts {
				if stat, err := os.Stat(m.HostSrcPath); err == nil && stat.IsDir() {
					libDatabox.Err("HostSrcPath must exist. " + err.Error())
					return
				}
			}
		}

		Start(opts)
		ShowLogs()
	case "stop":
		libDatabox.Info("Stoping Databox ...")
		stopCmd.Parse(os.Args[2:])
		Stop()
	case "logs":
		logsCmd.Parse(os.Args[2:])
		ShowLogs()
	case "sdk":
		sdkCmd.Parse(os.Args[2:])

		if *startSDK == true {
			sdkCmd.Parse(os.Args[2:])
			libDatabox.Info("Starting Databox SDK")
			StartSDK(*sdkCmdRegistry, *sdkCmdRelease)

		} else if *stopSDK == true {
			libDatabox.Info("Stoping Databox SDK")
			StopSDK()
		} else {
			sdkCmd.Usage()
		}
	case "wipe":
		wipeCmd.Parse(os.Args[2:])

		if *wipeCmdYes == false {
			fmt.Println("No changes made you did not add the -y flag")
			return
		}

		fmt.Println("This will wipe all databox data. Are you sure?")
		fmt.Println("you have 10 seconds to change your mind (ctrl+c to exit)")
		fmt.Println("\n If you do not exit I will delete: \n")
		volumes := listDockerVolumesMatching("-core-store")
		var volumesToDelete []*types.Volume
		for _, v := range volumes {
			if *wipeCmdLeaveApps == true && v.Name == "container-manager-core-store" {
				continue
			}
			volumesToDelete = append(volumesToDelete, v)
			fmt.Println(v.Name)
		}
		time.Sleep(10 * time.Second)

		fmt.Println("Stoping Databox ...")
		Stop()

		fmt.Println("Removing all app and driver data ....")

		removeVolumes(volumesToDelete)

		if *wipeCmdRemoveCerts {
			fmt.Println("Removing certificates ....")
			volume := listDockerVolumesMatching("container-manager-certs")
			removeVolumes(volume)
		}

	case "test":

		testCmd.Parse(os.Args[2:])

		if *testCmdNetwork {

			fmt.Println("Listing addresses")
			fmt.Println(removeIPv6addresses(getLocalInterfaceIps()))
			fmt.Println("Testing DNS")

			adr, err := net.LookupHost("google.com")
			if err != nil {
				libDatabox.Err("Could not look up google.com is DNS broken? " + err.Error())
			} else {
				fmt.Println("google.com's ips are ", adr)
			}
			fmt.Println("Trying to get external IP ")
			externalIP, err := getExternalIP()
			if err != nil {
				libDatabox.Err("Could not get external IP address, do you have network connectivity? " + err.Error())
			} else {
				fmt.Println("external IP is ", externalIP)
			}
		} else {
			testCmd.Usage()
		}
	default:
		displayUsage()
		os.Exit(2)
	}

}

func displayUsage() {
	fmt.Println(`
		databox [cmd]
		Usage:
			start - start databox
			stop - stop databox
			logs - view databox logs
			sdk  - manage the databox sdk
			wipe  - remove databox data

		Use databox [cmd] help to see more options
		`)
}

func Start(opt *libDatabox.ContainerManagerOptions) {

	_, err := dockerCli.SwarmInit(context.Background(), swarm.InitRequest{
		ListenAddr:    "127.0.0.1",
		AdvertiseAddr: opt.SwarmAdvertiseAddress,
	})
	libDatabox.ChkErrFatal(err)

	os.Remove("/tmp/databox_relay")
	err = syscall.Mkfifo("/tmp/databox_relay", 0666)
	libDatabox.ChkErrFatal(err)

	createContainerManager(opt)

}

func Stop() {

	_, err := dockerCli.SwarmInspect(context.Background())
	if err != nil {
		//Not in swarm mode databox is not running
		return
	}
	filters := filters.NewArgs()
	filters.Add("label", "databox.type")

	services, err := dockerCli.ServiceList(context.Background(), types.ServiceListOptions{Filters: filters})
	libDatabox.ChkErr(err)

	if len(services) > 0 {
		for _, service := range services {
			libDatabox.Info("Removing old databox service " + service.Spec.Name)
			err := dockerCli.ServiceRemove(context.Background(), service.ID)
			libDatabox.ChkErr(err)
		}
	}

	dockerCli.SwarmLeave(context.Background(), true)

	containers, err := dockerCli.ContainerList(context.Background(), types.ContainerListOptions{Filters: filters})
	libDatabox.ChkErr(err)

	if len(containers) > 0 {
		for _, container := range containers {
			libDatabox.Info("Removing old databox container " + container.Image)
			err := dockerCli.ContainerStop(context.Background(), container.ID, nil)
			libDatabox.ChkErr(err)
			err = dockerCli.ContainerRemove(context.Background(), containers[0].ID, types.ContainerRemoveOptions{Force: true})
			libDatabox.ChkErr(err)
		}
	}

}

func listDockerVolumesMatching(filterString string) []*types.Volume {
	f := filters.NewArgs()
	f.Add("name", filterString)
	volumes, err := dockerCli.VolumeList(context.Background(), f)
	libDatabox.ChkErrFatal(err)

	return volumes.Volumes
}

func removeVolumes(volumes []*types.Volume) {
	for _, v := range volumes {
		fmt.Print("Removing ", v.Name, "....")
		err := dockerCli.VolumeRemove(context.Background(), v.Name, true)
		libDatabox.ChkErrFatal(err)
		fmt.Println("   Done! ")
	}
}

func createContainerManager(options *libDatabox.ContainerManagerOptions) {

	portConfig := []swarm.PortConfig{
		swarm.PortConfig{
			TargetPort:    443,
			PublishedPort: 443,
			PublishMode:   "host",
		},
		swarm.PortConfig{
			TargetPort:    80,
			PublishedPort: 80,
			PublishMode:   "host",
		},
	}

	//create options secret
	optionsJSON, err := json.Marshal(options)
	libDatabox.ChkErrFatal(err)
	secretCreateResponse, err := dockerCli.SecretCreate(context.Background(), swarm.SecretSpec{
		Annotations: swarm.Annotations{
			Name: "DATABOX_CM_OPTIONS",
		},
		Data: optionsJSON,
	})
	libDatabox.ChkErrFatal(err)

	cmOptionsSecret := swarm.SecretReference{
		SecretID:   secretCreateResponse.ID,
		SecretName: "DATABOX_CM_OPTIONS",
		File: &swarm.SecretReferenceFileTarget{
			Name: "DATABOX_CM_OPTIONS",
			UID:  "0",
			GID:  "0",
			Mode: 0444,
		},
	}

	service := swarm.ServiceSpec{
		TaskTemplate: swarm.TaskSpec{
			ContainerSpec: &swarm.ContainerSpec{
				Image:    options.ContainerManagerImage,
				Hostname: "container-manager",
				Labels:   map[string]string{"databox.type": "container-manager"},
				Env: []string{
					"DATABOX_ARBITER_ENDPOINT=tcp://arbiter:4444",
					"DATABOX_SDK=0",
				},
				Mounts: []mount.Mount{
					mount.Mount{
						Type:   mount.TypeBind,
						Source: "/var/run/docker.sock",
						Target: "/var/run/docker.sock",
					},
					mount.Mount{
						Source: "container-manager-certs",
						Target: "/certs",
						Type:   mount.TypeVolume,
					},
				},
				Secrets: []*swarm.SecretReference{&cmOptionsSecret},
			},
			Placement: &swarm.Placement{
				Constraints: []string{"node.role == manager"},
			},
		},
		EndpointSpec: &swarm.EndpointSpec{
			Mode:  "dnsrr",
			Ports: portConfig,
		},
	}

	service.Name = "container-manager"

	serviceOptions := types.ServiceCreateOptions{}

	pullImage(service.TaskTemplate.ContainerSpec.Image, options)
	_, err = dockerCli.ServiceCreate(context.Background(), service, serviceOptions)
	libDatabox.ChkErr(err)

}

func pullImage(image string, options *libDatabox.ContainerManagerOptions) {

	needToPull := true

	//do we have the image on disk?
	images, _ := dockerCli.ImageList(context.Background(), types.ImageListOptions{})
	for _, i := range images {
		for _, tag := range i.RepoTags {
			if image == tag {
				//we have the image no need to pull it !!
				needToPull = false
				break
			}
		}
	}

	//is it from the default registry (databoxsystems or whatever we overroad with) and tagged with latest?
	if strings.Contains(image, options.DefaultRegistry) == true && strings.Contains(image, ":latest") == true {
		//its in the default registry and has the :latest tag lets pull it to make sure we are up-to-date
		needToPull = true
	}

	if needToPull == true {
		libDatabox.Info("Pulling Image " + image)
		reader, err := dockerCli.ImagePull(context.Background(), image, types.ImagePullOptions{})
		libDatabox.ChkErr(err)
		io.Copy(ioutil.Discard, reader)
		libDatabox.Info("Done pulling Image " + image)
		reader.Close()
	}
}

func removeContainer(name string) {
	filters := filters.NewArgs()
	filters.Add("name", name)
	containers, clerr := dockerCli.ContainerList(context.Background(), types.ContainerListOptions{
		Filters: filters,
		All:     true,
	})
	libDatabox.ChkErr(clerr)

	if len(containers) > 0 {
		rerr := dockerCli.ContainerRemove(context.Background(), containers[0].ID, types.ContainerRemoveOptions{Force: true})
		libDatabox.ChkErr(rerr)
	}
}

func getLocalInterfaceIps() []string {
	IPs := []string{}
	ifaces, _ := net.Interfaces()
	for _, i := range ifaces {
		addrs, _ := i.Addrs()
		for _, addr := range addrs {
			switch v := addr.(type) {
			case *net.IPNet:
				IPs = append(IPs, v.IP.String())
			case *net.IPAddr:
				IPs = append(IPs, v.IP.String())
			}
		}
	}
	return IPs
}

func removeIPv6addresses(addresses []string) []string {
	var filteredIPs []string
	for _, ip := range addresses {
		parsedIP := net.ParseIP(ip)
		if parsedIP.To4() != nil {
			filteredIPs = append(filteredIPs, ip)
		}
	}
	return filteredIPs
}

func getExternalIP() (string, error) {
	var netTransport = &http.Transport{
		Dial: (&net.Dialer{
			Timeout: 5 * time.Second,
		}).Dial,
		TLSHandshakeTimeout: 5 * time.Second,
	}
	var netClient = &http.Client{
		Timeout:   time.Second * 10,
		Transport: netTransport,
	}
	response, err := netClient.Get("http://whatismyip.akamai.com/")
	if err != nil {
		libDatabox.Debug("[ERROR] " + err.Error())
		return "", err
	}
	ip, err := ioutil.ReadAll(response.Body)
	if err != nil {
		libDatabox.Debug("[ERROR] " + err.Error())
		return "", err
	}
	response.Body.Close()
	libDatabox.Debug("External IP found " + string(ip))
	return string(ip), nil
}
