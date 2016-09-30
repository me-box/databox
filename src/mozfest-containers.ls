require! {
  './container-manager.ls': con-man
}

const server-port = process.env.PORT or 8080
export const registry-url = 'registry.upintheclouds.org'

export run = ->
  console.log 'Stating Mozfest containers ....'
  |> -> con-man.launch-container registry-url+'/databox-driver-mobile:latest'  
  |> -> con-man.launch-container registry-url+'/vendor-phidgets:latest'