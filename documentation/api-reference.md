# VIM Monitoring API Reference

The VIM Monitoring Back-End offers a read-only API mostly on measurement
events. Additionally, support for subscription is included, both for regular
measurement events and alarm triggers.

For the latest, up-to-date API documentation, please consult the [Swagger
UI](http://swagger.io/) which is available on every back-end deployment at the
`docs` endopoint of the HTTP service.

In any case, one may also use CLI tools, such as curl or wget. In the following
sections curl is going to be used as an example command and the example
response will be shown.

## Measurement-related events

#### List the available measurement types

    GET /measurementTypes

Example:

```
curl -X GET --header 'Accept: application/json' 'http://monitoring_backend_url/api/measurementTypes'
```

Example response:

```
[
  {
    "endPoint": "cpuidle",
    "description": "Get the latest value of idle CPU usage on a specific instance"
  },
  {
    "endPoint": "cpu_util",
    "description": "Get the latest value of CPU utilisation on a specific instance"
  },
  {
    "endPoint": "fsfree",
    "description": "Get the latest root filesystem status on a specific instance"
  },
  {
    "endPoint": "memfree",
    "description": "Get the latest value of free memory on a specific instance"
  },
  {
    "endPoint": "network_incoming",
    "description": "Get the latest value of rate of incoming bytes on a specific instance"
  },
  {
    "endPoint": "network_outgoing",
    "description": "Get the latest value of rate of outgoing bytes on a specific instance"
  },
  {
    "endPoint": "load_shortterm",
    "description": "Get the latest value of load average of the past one minute"
  },
  {
    "endPoint": "load_midterm",
    "description": "Get the latest value of load average of the past five minutes"
  },
  {
    "endPoint": "load_longterm",
    "description": "Get the latest value of load average of the past fifteen minutes"
  },
  {
    "endPoint": "processes_blocked",
    "description": "Get the latest value of blocked processes"
  },
  {
    "endPoint": "processes_paging",
    "description": "Get the latest value of paging processes"
  },
  {
    "endPoint": "processes_running",
    "description": "Get the latest value of running processes"
  },
  {
    "endPoint": "processes_sleeping",
    "description": "Get the latest value of sleeping processes"
  },
  {
    "endPoint": "processes_stopped",
    "description": "Get the latest value of stopped processes"
  },
  {
    "endPoint": "processes_zombie",
    "description": "Get the latest value of zombie processes"
  },
  {
    "endPoint": "cachediskutilization",
    "description": "Cache disk utilization"
  },
  {
    "endPoint": "cachememkutilization",
    "description": "Cache memory utilization"
  },
  {
    "endPoint": "cpuusage",
    "description": "CPU consumed by Squid for the last 5 minutes"
  },
  {
    "endPoint": "diskhits",
    "description": "Disk hits percentage for the last 5 minutes (hits that are logged as TCP_HIT)"
  },
  {
    "endPoint": "hits",
    "description": "Cache hits percentage of all requests for the last 5 minutes"
  },
  {
    "endPoint": "hits_bytes",
    "description": "Cache hits percentage of bytes sent for the last 5 minutes"
  },
  {
    "endPoint": "httpnum",
    "description": "Number of HTTP requests received"
  },
  {
    "endPoint": "memoryhits",
    "description": "Memory hits percentage for the last 5 minutes (hits that are logged as TCP_MEM_HIT)"
  },
  {
    "endPoint": "usernum",
    "description": "Number of users accessing the proxy"
  },
  {
    "endPoint": "rtp_frame_loss",
    "description": "RTP frame loss"
  },
  {
    "endPoint": "rtp_pack_in",
    "description": "Number of incoming RTP packets"
  },
  {
    "endPoint": "rtp_pack_in_byte",
    "description": "Number of incoming RTP bytes"
  },
  {
    "endPoint": "rtp_pack_out",
    "description": "Number of outgoing RTP packets"
  },
  {
    "endPoint": "rtp_pack_out_byte",
    "description": "Number of outgoing RTP bytes"
  },
  {
    "endPoint": "mbits_packets_all",
    "description": "Bandwidth for all allowed traffic"
  },
  {
    "endPoint": "mbits_packets_apple",
    "description": "Bandwidth for Apple-related traffic"
  },
  {
    "endPoint": "mbits_packets_bittorrent",
    "description": "Bandwidth for BitTorrent traffic"
  },
  {
    "endPoint": "mbits_packets_dns",
    "description": "Bandwidth for DNS traffic"
  },
  {
    "endPoint": "mbits_packets_dropbox",
    "description": "Bandwidth for Dropbox traffic"
  },
  {
    "endPoint": "mbits_packets_google",
    "description": "Bandwidth for Google-related traffic"
  },
  {
    "endPoint": "mbits_packets_http",
    "description": "Bandwidth for HTTP traffic"
  },
  {
    "endPoint": "mbits_packets_icloud",
    "description": "Bandwidth for iCloud traffic"
  },
  {
    "endPoint": "mbits_packets_skype",
    "description": "Bandwidth for Skype traffic"
  },
  {
    "endPoint": "mbits_packets_twitter",
    "description": "Bandwidth for Twitter traffic"
  },
  {
    "endPoint": "mbits_packets_viber",
    "description": "Bandwidth for Viber traffic"
  },
  {
    "endPoint": "mbits_packets_youtube",
    "description": "Bandwidth for Youtube traffic"
  }
]
```

#### Get the latest measurements

    POST /measurements

This endpoint serves as a quick way to show multiple measurements from
a variable number of VNFs. The expected response is identical to the response
coming from a subscription event. It uses the following parameters:

```
{
  "types": [
    "string"
  ],
  "instances": [
    "string"
  ]
}
```

where *types* are the measurement types as appear in the previous endpoint and
*instances* are the OpenStack UUIDs of the target VNFs.

Example:

```
curl -X POST --header 'Content-Type: application/json' --header 'Accept: application/json' -d '{
  "types": [
    "cpu_util", "hits"
  ],
  "instances": [
    "faeb3e00-12e2-470b-85cf-55f89a30bffa"
  ]
}' 'http://monitoring_backend_url/api/measurements'
```

Example response:

```
[
  {
    "instance": "faeb3e00-12e2-470b-85cf-55f89a30bffa",
    "measurements": [
      {
        "timestamp": "2016-03-03T12:10:13.325115753Z",
        "value": 0.53332637964622,
        "units": "percentage",
        "type": "cpu_util"
      },
      {
        "timestamp": "2016-03-15T13:54:03.399055022Z",
        "value": 0,
        "units": "percentage",
        "type": "hits"
      }
    ]
  }
]
```

### Generic measurements

Generic measurements contain measurements that every running VNF should report
back to the monitoring back-end.

#### Get the latest value of CPU utilisation on a specific instance

    GET /measurements/{instance}.cpu_util

Example:

```
curl -X GET --header 'Accept: application/json' 'http://monitoring_backend_url/api/measurements/faeb3e00-12e2-470b-85cf-55f89a30bffa.cpu_util'
```

Example response:

```
{
  "timestamp": "2016-03-03T12:10:13.325115753Z",
  "value": 0.53332637964622,
  "units": "percentage"
}
```

#### Get the latest value of idle CPU usage on a specific instance

    GET /measurements/{instance}.cpuidle

Example:

```
curl -X GET --header 'Accept: application/json' 'http://monitoring_backend_url/api/measurements/faeb3e00-12e2-470b-85cf-55f89a30bffa.cpuidle'
```

Example response:

```
{
  "timestamp": "2016-03-11T13:49:30.430623Z",
  "value": 11025690,
  "units": "jiffies"
}
```

#### Get the latest root filesystem status on a specific instance

    GET /measurements/{instance}.fsfree

Example:

```
curl -X GET --header 'Accept: application/json' 'http://monitoring_backend_url/api/measurements/faeb3e00-12e2-470b-85cf-55f89a30bffa.fsfree'
```

Example response:

```
{
  "timestamp": "2016-02-12T11:15:45.729599Z",
  "value": "17.2",
  "unit": "GB"
}
```

#### Get the latest value of load average of the past fifteen minutes

    GET /measurements/{instance}.load_longterm

Example:

```
curl -X GET --header 'Accept: application/json' 'http://monitoring_backend_url/api/measurements/9239bef4-7a7e-45ae-b589-7392758a771b.load_longterm'
```

Example response:

```
{
  "timestamp": "2016-02-12T11:15:45.729664Z",
  "value": 0.09,
  "units": "runnable processes"
}
```

#### Get the latest value of load average of the past five minutes

    GET /measurements/{instance}.load_midterm

Example:

```
curl -X GET --header 'Accept: application/json' 'http://monitoring_backend_url/api/measurements/9239bef4-7a7e-45ae-b589-7392758a771b.load_midterm'
```

Example response:

```
{
  "timestamp": "2016-02-12T11:15:45.729664Z",
  "value": 0.08,
  "units": "runnable processes"
}
```

#### Get the latest value of load average of the past one minute

    GET /measurements/{instance}.load_shortterm

Example:

```
curl -X GET --header 'Accept: application/json' 'http://monitoring_backend_url/api/measurements/9239bef4-7a7e-45ae-b589-7392758a771b.load_shortterm'
```

Example response:

```
{
  "timestamp": "2016-02-12T11:15:45.729664Z",
  "value": 0,
  "units": "runnable processes"
}
```

#### Get the latest value of free memory on a specific instance

    GET /measurements/{instance}.memfree

Example:

```
curl -X GET --header 'Accept: application/json' 'http://monitoring_backend_url/api/measurements/9239bef4-7a7e-45ae-b589-7392758a771b.memfree'
```

Example response:

```
{
  "timestamp": "2016-02-12T11:15:35.732198Z",
  "value": "1.19",
  "unit": "GB"
}
```

#### Get the latest value of rate of incoming bytes on a specific instance

    GET /measurements/{instance}.network_incoming

Example:

```
curl -X GET --header 'Accept: application/json' 'http://monitoring_backend_url/api/measurements/9239bef4-7a7e-45ae-b589-7392758a771b.network_incoming'
```

Example response:

```
{
  "timestamp": "2016-03-09T18:29:38.609322925Z",
  "value": 3.1694395321603306,
  "units": "Bytes / s"
}
```

#### Get the latest value of rate of outgoing bytes on a specific instance

    GET /measurements/{instance}.network_outgoing

Example:

```
curl -X GET --header 'Accept: application/json' 'http://monitoring_backend_url/api/measurements/9239bef4-7a7e-45ae-b589-7392758a771b.network_outgoing'
```

Example response:

```
{
  "timestamp": "2016-03-09T18:29:38.585332404Z",
  "value": 0,
  "units": "Bytes / s"
}
```

#### Get the latest value of blocked processes

    GET /measurements/{instance}.processes_blocked

Example:

```
curl -X GET --header 'Accept: application/json' 'http://monitoring_backend_url/api/measurements/9239bef4-7a7e-45ae-b589-7392758a771b.processes_blocked'
```

Example response:

```
{
  "timestamp": "2016-02-12T11:15:35.732225Z",
  "value": 0,
  "units": "processes"
}
```

#### Get the latest value of paging processes

    GET /measurements/{instance}.processes_paging

Example:

```
curl -X GET --header 'Accept: application/json' 'http://monitoring_backend_url/api/measurements/9239bef4-7a7e-45ae-b589-7392758a771b.processes_paging'
```

Example response:

```
{
  "timestamp": "2016-02-12T11:15:35.73222Z",
  "value": 0,
  "units": "processes"
}
```

#### Get the latest value of running processes

    GET /measurements/{instance}.processes_running

Example:

```
curl -X GET --header 'Accept: application/json' 'http://monitoring_backend_url/api/measurements/9239bef4-7a7e-45ae-b589-7392758a771b.processes_running'
```

Example response:

```
{
  "timestamp": "2016-02-12T11:15:35.732082Z",
  "value": 1,
  "units": "processes"
}
```

#### Get the latest value of sleeping processes

    GET /measurements/{instance}.processes_sleeping

Example:

```
curl -X GET --header 'Accept: application/json' 'http://monitoring_backend_url/api/measurements/9239bef4-7a7e-45ae-b589-7392758a771b.processes_sleeping'
```

Example response:

```
{
  "timestamp": "2016-02-12T11:15:35.732205Z",
  "value": 83,
  "units": "processes"
}
```

#### Get the latest value of stopped processes

    GET /measurements/{instance}.processes_stopped

Example:

```
curl -X GET --header 'Accept: application/json' 'http://monitoring_backend_url/api/measurements/9239bef4-7a7e-45ae-b589-7392758a771b.processes_stopped'
```

Example response:

```
{
  "timestamp": "2016-02-12T11:15:35.732215Z",
  "value": 0,
  "units": "processes"
}
```

#### Get the latest value of zombie processes

    GET /measurements/{instance}.processes_zombie

Example:

```
curl -X GET --header 'Accept: application/json' 'http://monitoring_backend_url/api/measurements/9239bef4-7a7e-45ae-b589-7392758a771b.processes_zombie'
```

Example response:

```
{
  "timestamp": "2016-02-12T11:15:35.73221Z",
  "value": 0,
  "units": "processes"
}
```

### vProxy-specific measurements

#### Get the latest value of cache disk utilisation

    GET /measurements/{instance}.cachediskutilization

Example:

```
curl -X GET --header 'Accept: application/json' 'http://monitoring_backend_url/api/measurements/faeb3e00-12e2-470b-85cf-55f89a30bffa.cachediskutilization'
```

Example response:

```
{
  "timestamp": "2016-03-15T13:54:03.500769402Z",
  "value": 2.3,
  "units": "percentage"
}
```

#### Get the latest value of cache memory utilisation

    GET /measurements/{instance}.cachememkutilization

Example:

```
curl -X GET --header 'Accept: application/json' 'http://monitoring_backend_url/api/measurements/faeb3e00-12e2-470b-85cf-55f89a30bffa.cachememkutilization'
```

Example response:

```
{
  "timestamp": "2016-03-15T13:54:03.506567558Z",
  "value": 0.1,
  "units": "percentage"
}
```

#### Get the latest value of CPU consumed by Squid for the last 5 minutes

    GET /measurements/{instance}.cpuusage

Example:

```
curl -X GET --header 'Accept: application/json' 'http://monitoring_backend_url/api/measurements/faeb3e00-12e2-470b-85cf-55f89a30bffa.cpuusage'
```

Example response:

```
{
  "timestamp": "2016-03-15T13:54:03.515693444Z",
  "value": 5.6,
  "units": "percentage"
}
```

#### Get the latest value of disk hits percentage for the last 5 minutes (hits that are logged as TCP_HIT)

    GET /measurements/{instance}.diskhits

Example:

```
curl -X GET --header 'Accept: application/json' 'http://monitoring_backend_url/api/measurements/faeb3e00-12e2-470b-85cf-55f89a30bffa.diskhits'
```

Example response:

```
{
  "timestamp": "2016-03-15T13:54:03.495478792Z",
  "value": 0,
  "units": "percentage"
}
```

#### Get the latest value of cache hits percentage of all requests for the last 5 minutes

    GET /measurements/{instance}.hits

Example:

```
curl -X GET --header 'Accept: application/json' 'http://monitoring_backend_url/api/measurements/faeb3e00-12e2-470b-85cf-55f89a30bffa.hits'
```

Example response:

```
{
  "timestamp": "2016-03-15T13:54:03.399055022Z",
  "value": 0,
  "units": "percentage"
}
```

#### Get the latest value of cache hits percentage of bytes sent for the last 5 minutes

    GET /measurements/{instance}.hits_bytes

Example:

```
curl -X GET --header 'Accept: application/json' 'http://monitoring_backend_url/api/measurements/faeb3e00-12e2-470b-85cf-55f89a30bffa.hits_bytes'
```

Example response:

```
{
  "timestamp": "2016-03-15T13:54:03.485884897Z",
  "value": 0,
  "units": "percentage"
}
```

#### Get the latest value of number of HTTP requests received

    GET /measurements/{instance}.httpnum

Example:

```
curl -X GET --header 'Accept: application/json' 'http://monitoring_backend_url/api/measurements/faeb3e00-12e2-470b-85cf-55f89a30bffa.httpnum'
```

Example response:

```
{
  "timestamp": "2016-03-15T13:54:03.304480341Z",
  "value": 0
}
```

#### Get the latest value of memory hits percentage for the last 5 minutes (hits that are logged as TCP_MEM_HIT)

    GET /measurements/{instance}.memoryhits

Example:

```
curl -X GET --header 'Accept: application/json' 'http://monitoring_backend_url/api/measurements/faeb3e00-12e2-470b-85cf-55f89a30bffa.memoryhits'
```

Example response:

```
{
  "timestamp": "2016-03-15T13:54:03.490638013Z",
  "value": 0,
  "units": "percentage"
}
```

#### Get the latest value of number of users accessing the proxy

    GET /measurements/{instance}.usernum

Example:

```
curl -X GET --header 'Accept: application/json' 'http://monitoring_backend_url/api/measurements/faeb3e00-12e2-470b-85cf-55f89a30bffa.usernum'
```

Example response:

```
{
  "timestamp": "2016-03-15T13:54:03.511457444Z",
  "value": 1
}
```

### vSBC-specific measurements

#### Get the latest value of RTP frame loss

    GET /measurements/{instance}.rtp_frame_loss

Example:

```
curl -X GET --header 'Accept: application/json' 'http://monitoring_backend_url/api/measurements/8cd0582f-a9f8-4351-87e8-005e10fb90f6.rtp_frame_loss'
```

Example response:

```
{
  "timestamp": "2016-03-07T08:31:04.580961549Z",
  "value": 0,
  "units": "frames"
}
```

#### Get the latest number of incoming RTP packets

    GET /measurements/{instance}.rtp_pack_in

Example:

```
curl -X GET --header 'Accept: application/json' 'http://monitoring_backend_url/api/measurements/8cd0582f-a9f8-4351-87e8-005e10fb90f6.rtp_pack_in'
```

Example response:

```
{
  "timestamp": "2016-03-07T08:31:04.493425024Z",
  "value": 0,
  "units": "packets"
  }
```

#### Get the latest number of incoming RTP bytes

    GET /measurements/{instance}.rtp_pack_in_byte

Example:

```
curl -X GET --header 'Accept: application/json' 'http://monitoring_backend_url/api/measurements/8cd0582f-a9f8-4351-87e8-005e10fb90f6.rtp_pack_in_byte'
```

Example response:

```
{
  "timestamp": "2016-03-07T08:31:04.536511102Z",
  "value": 0,
  "units": "Bytes"
}
```

#### Get the latest number of outgoing RTP packets

    GET /measurements/{instance}.rtp_pack_out

Example:

```
curl -X GET --header 'Accept: application/json' 'http://monitoring_backend_url/api/measurements/8cd0582f-a9f8-4351-87e8-005e10fb90f6.rtp_pack_out'
```

Example response:

```
{
  "timestamp": "2016-03-07T08:31:04.515325854Z",
  "value": 0,
  "units": "packets"
}
```

#### Get the latest number of outgoing RTP bytes

    GET /measurements/{instance}.rtp_pack_out_byte

Example:

```
curl -X GET --header 'Accept: application/json' 'http://monitoring_backend_url/api/measurements/8cd0582f-a9f8-4351-87e8-005e10fb90f6.rtp_pack_out_byte'
```

Example response:

```
{
  "timestamp": "2016-03-07T08:31:04.559198823Z",
  "value": 0,
  "units": "Bytes"
}
```

### vTC-specific measurements

#### Get the latest bandwidth for all allowed traffic

    GET /measurements/{instance}.mbits_packets_all

Example:

```
curl -X GET --header 'Accept: application/json' 'http://monitoring_backend_url/api/measurements/775e3177-5ab0-4910-84df-4ae4bfa5e1e7.mbits_packets_all'
```

Example response:

```
{
  "timestamp": "2016-04-12T16:19:43.950626484Z",
  "value": 120251608,
  "units": "bits / s"
}
```

#### Get the latest bandwidth for Apple-related traffic

    GET /measurements/{instance}.mbits_packets_apple

Example:

```
curl -X GET --header 'Accept: application/json' 'http://monitoring_backend_url/api/measurements/775e3177-5ab0-4910-84df-4ae4bfa5e1e7.mbits_packets_apple'
```

Example response:

```
{
  "timestamp": "2016-04-12T16:19:43.950626484Z",
  "value": 0,
  "units": "bits / s"
}
```

#### Get the latest bandwidth for BitTorrent traffic

    GET /measurements/{instance}.mbits_packets_bittorrent

Example:

```
curl -X GET --header 'Accept: application/json' 'http://monitoring_backend_url/api/measurements/775e3177-5ab0-4910-84df-4ae4bfa5e1e7.mbits_packets_bittorrent'
```

Example response:

```
{
  "timestamp": "2016-04-12T16:19:43.950626484Z",
  "value": 14950200,
  "units": "bits / s"
}
```

#### Get the latest bandwidth for DNS traffic

    GET /measurements/{instance}.mbits_packets_dns

Example:

```
curl -X GET --header 'Accept: application/json' 'http://monitoring_backend_url/api/measurements/775e3177-5ab0-4910-84df-4ae4bfa5e1e7.mbits_packets_dns'
```

Example response:

```
{
  "timestamp": "2016-04-12T16:19:43.950626484Z",
  "value": 0,
  "units": "bits / s"
}
```

#### Get the latest bandwidth for DropBox traffic

    GET /measurements/{instance}.mbits_packets_dropbox

Example:

```
curl -X GET --header 'Accept: application/json' 'http://monitoring_backend_url/api/measurements/775e3177-5ab0-4910-84df-4ae4bfa5e1e7.mbits_packets_dropbox'
```

Example response:

```
{
  "timestamp": "2016-04-12T16:19:43.950626484Z",
  "value": 96720,
  "units": "bits / s"
}
```

#### Get the latest bandwidth for Google-related traffic

    GET /measurements/{instance}.mbits_packets_google

Example:

```
curl -X GET --header 'Accept: application/json' 'http://monitoring_backend_url/api/measurements/775e3177-5ab0-4910-84df-4ae4bfa5e1e7.mbits_packets_google'
```

Example response:

```
{
  "timestamp": "2016-04-12T16:19:43.950626484Z",
  "value": 3611096,
  "units": "bits / s"
}
```

#### Get the latest bandwidth for HTTP traffic

    GET /measurements/{instance}.mbits_packets_http

Example:

```
curl -X GET --header 'Accept: application/json' 'http://monitoring_backend_url/api/measurements/775e3177-5ab0-4910-84df-4ae4bfa5e1e7.mbits_packets_http'
```

Example response:

```
{
  "timestamp": "2016-04-12T16:19:43.950626484Z",
  "value": 12264752,
  "units": "bits / s"
}
```

#### Get the latest bandwidth for iCloud traffic

    GET /measurements/{instance}.mbits_packets_icloud

Example:

```
curl -X GET --header 'Accept: application/json' 'http://monitoring_backend_url/api/measurements/775e3177-5ab0-4910-84df-4ae4bfa5e1e7.mbits_packets_icloud'
```

Example response:

```
{
  "timestamp": "2016-04-12T16:19:43.950626484Z",
  "value": 35856,
  "units": "bits / s"
}
```

#### Get the latest bandwidth for Skype traffic

    GET /measurements/{instance}.mbits_packets_skype

Example:

```
curl -X GET --header 'Accept: application/json' 'http://monitoring_backend_url/api/measurements/775e3177-5ab0-4910-84df-4ae4bfa5e1e7.mbits_packets_skype'
```

Example response:

```
{
  "timestamp": "2016-04-12T16:19:43.950626484Z",
  "value": 904,
  "units": "bits / s"
}
```

#### Get the latest bandwidth for Twitter traffic

    GET /measurements/{instance}.mbits_packets_twitter

Example:

```
curl -X GET --header 'Accept: application/json' 'http://monitoring_backend_url/api/measurements/775e3177-5ab0-4910-84df-4ae4bfa5e1e7.mbits_packets_twitter'
```

Example response:

```
{
  "timestamp": "2016-04-12T16:19:43.950626484Z",
  "value": 769320,
  "units": "bits / s"
}
```

#### Get the latest bandwidth for Viber traffic

    GET /measurements/{instance}.mbits_packets_viber

Example:

```
curl -X GET --header 'Accept: application/json' 'http://monitoring_backend_url/api/measurements/775e3177-5ab0-4910-84df-4ae4bfa5e1e7.mbits_packets_viber'
```

Example response:

```
{
  "timestamp": "2016-04-12T16:19:43.950626484Z",
  "value": 0,
  "units": "bits / s"
}
```

#### Get the latest bandwidth for Youtube traffic

    GET /measurements/{instance}.mbits_packets_youtube

Example:

```
curl -X GET --header 'Accept: application/json' 'http://monitoring_backend_url/api/measurements/775e3177-5ab0-4910-84df-4ae4bfa5e1e7.mbits_packets_youtube'
```

Example response:

```
{
  "timestamp": "2016-04-12T16:19:43.950626484Z",
  "value": 23140128,
  "units": "bits / s"
}
```

## Subscriptions

### Measurement reading

#### List all the active subscriptions

    GET /subscriptions

Example:

```
curl -X GET --header 'Accept: application/json' 'http://monitoring_backend_url/api/subscriptions'
```

Example response:

```
[
  {
    "id": "_pvr14ogpn",
    "instances": [
      "faeb3e00-12e2-470b-85cf-55f89a30bffa"
    ],
    "measurementTypes": [
      "cpu_util",
      "hits"
    ],
    "interval": 5,
    "callbackUrl": "http://callback.url"
  }
]
```

#### Subscribe to a measurement event

    POST /subscriptions

If one wants to subscribe to a measurement event, then she has to use the
following parameters:

```
{
  "types": [
    "string"
  ],
  "instances": [
    "string"
  ],
  "interval": 0,
  "callbackUrl": "string"
}
```

where *types* and *instances* are known from previous examples, whileas
*interval* is the interval between sending new measurements in minutes and
*callbackUrl* the callback URL where the subscription service is supposed to
send the measurements.

Example:

```
curl -X POST --header 'Content-Type: application/json' --header 'Accept: text/html' -d '{
  "types": [
    "cpu_util", "hits"
  ],
  "instances": [
    "faeb3e00-12e2-470b-85cf-55f89a30bffa"
  ],
  "interval": 5,
  "callbackUrl": "http://callback.url"
}' 'http://monitoring_backend_url/api/subscriptions'
```

Example response:

```
Your subscription request has been registered successfully under ID _pvr14ogpn
```

#### Delete a specific subscription

    DELETE /subscriptions/{id}

Example:

```
curl -X DELETE --header 'Accept: text/html' 'http://monitoring_backend_url/api/subscriptions/_pvr14ogpn'
```

Example response:

```
Subscription was deleted
```

#### Get a specific subscription's details

    GET /subscriptions/{id}

Example:

```
curl -X GET --header 'Accept: application/json' 'http://monitoring_backend_url/api/subscriptions/_pvr14ogpn'
```

Example response:

```
{
  "instances": [
    "faeb3e00-12e2-470b-85cf-55f89a30bffa"
  ],
  "measurementTypes": [
    "cpu_util",
    "hits"
  ],
  "interval": 5,
  "callbackUrl": "http://callback.url"
}
```

### Alarm triggering

#### List all the active alarm triggers

    GET /alarms

Example:

```
curl -X GET --header 'Accept: application/json' 'http://monitoring_backend_url/api/alarms'
```

Example response:

```
[
  {
    "id": "_xvazxyrfc",
    "triggers": [
      {
        "type": "memfree",
        "comparisonOperator": "gt",
        "threshold": 8018198432
      }
    ],
    "instances": [
      "instance1",
      "instance2"
    ],
    "callbackUrl": "http://callback_url1"
  },
  {
    "id": "_23zy3xgdg",
    "triggers": [
      {
        "type": "cpu_util",
        "comparisonOperator": "gt",
        "threshold": 0.80
      }
    ],
    "instances": [
      "instance1",
      "instance2"
    ],
    "callbackUrl": "http://callback_url2"
  }
]
```

#### Create an alarm trigger

    POST /alarms

If one wants to create an alarm trigger, then she has to use the
following parameters:

```
{
  "triggers": [
    {
      "type": "string",
      "comparisonOperator": "string",
      "threshold": 0
    }
  ],
  "instances": [
    "string"
  ],
  "callbackUrl": "string"
}
```

where *type*, *instances* and *callbackUrl* are known from previous examples,
*comparisonOperator* is "lt" for "less", "le" for "less or equal, "eq" for
"equal", "ne" for "not equal", "ge" for "greater or equal" and "gt" for
"greater" and *threshold* is the value to be compared with.

Example:

```
curl -X POST --header 'Content-Type: application/json' --header 'Accept: application/json' -d '{
  "triggers": [
    {
      "type": "memfree",
      "comparisonOperator": "gt",
      "threshold": 8018198432
    }
  ],
  "instances": [
    "instance1", "instance2"
  ],
  "callbackUrl": "http://callback_url1"
}' 'http://monitoring_backend_url/api/alarms'
```

Example response:

```
{
  "status": "alarm created",
  "id": "_23zy3xgdg"
}
```

A possible trigger of the alarm in this example should send to
`http://callback_url1` the following JSON object:

```
{
    "measurementType": "memfree",
    "expected": "gt 8018198432",
    "alarmingInstances": [
        {
            "instance": "instance1",
            "value": 8018194432,
            "time": "2016-04-16T11:39:32.069012Z"
        }
    ]
}
```

where *measurementType* is the measurement type of one trigger, *expected* the
condition that was set in that trigger, *alarmingInstances* the instances
which triggered the alarm and more specifically, *instance* the instance UUID,
*value* the measurement value and *time* the timestamp of the measurement.

#### Delete a specific alarm trigger

    DELETE /alarms/{id}

Example:

```
curl -X DELETE --header 'Accept: text/html' 'http://monitoring_backend_url/api/alarms/_xvazxyrfc'
```

Example response:

```
{
  "id": "_xvazxyrfc",
  "status": "alarm deleted"
}
```

#### Get a specific alarm trigger's details

    GET /alarms/{id}

Example:

```
curl -X GET --header 'Accept: application/json' 'http://monitoring_backend_url/api/alarms/_xvazxyrfc'
```

Example response:

```
{
  "id": "_xvazxyrfc",
  "triggers": [
    {
      "type": "memfree",
      "comparisonOperator": "gt",
      "threshold": 8018198432
    }
  ],
  "instances": [
    "archie",
    "archie2"
  ],
  "callbackUrl": "http://callback_url1"
}
```
