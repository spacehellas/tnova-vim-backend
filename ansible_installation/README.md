# T-NOVA VIM Monitoring Ansible Installation

This playbook provides the deployment of T-NOVA VIM Monitoring system on Ubuntu 14 server. 
Optionally, the playbook can be configured to provision an Openstack Virtual Machine in which to deploy the T-NOVA VIM Monitoring system.  


## How to run

In ansible_installation/site.yml make sure **"- include: openstack-vm-provision.yml"** is included and not commented out.
```yml
- include: openstack-vm-provision.yml
- include: tnova-vim-monitor.yml
```

In ansible_installation/inventory leave **[vm_group]** empty
```yml
[openstack-controller]
10.143.0.240 ansible_user=localadmin ansible_python_interpreter="~/ansible_venv/bin/python"

[vm_group]

```

## How to choose Openstack VM provisioning

```sh
ansible-playbook -i inventory site.yml 
```

## Files to edit

**File 1.** ansible_installation/group_vars/all:

```yml
# Username for openstack virtual machines
GLOB_OS_SSH_USERNAME: ubuntu
# Directory where python virtual environment containing ansible resides in openstack server
GLOB_OS_PYTHON_VENV: /home/localadmin/ansible_venv/bin/
```

**File 2.** ansible_installation/roles/tnova-vim-monitor/vars/main.yml:

```yml
DOCKER:
  API_VERSION: 1.18

INFLUX:
  NAME: influxdb
  PRE_CREATE_DB: statsdb
  COLLECTD_DB: statsdb
  COLLECTD_BINDING: ":8096"
  VOLUMES:
  - /srv/docker/tnova_vim/tsdb:/data
#  VOLUMES: /srv/docker/tnova_vim/tsdb:/data
  PORTS:
  - "8083:8083"
  - "8086:8086"
  - "8096:8096/udp"
  IMAGE: "tutum/influxdb:0.9"


MON_BACKEND:
  NAME: monitoring_backend
  CEILOMETER_HOST: 10.143.0.240
  CEILOMETER_PORT: 8777
  POLLING_INTERVAL: 60000
  NOVA_HOST: 10.143.0.240
  NOVA_PORT: 8774
  IDENTITY_HOST: 10.143.0.240
  IDENTITY_PORT: 5000
  IDENTITY_TENANT: admin
  IDENTITY_USERNAME: admin
  IDENTITY_PASSWORD: enter_password_here
  VOLUMES:
#  - /srv/docker/tnova_vim/tsdb:/data
  - /srv/docker/tnova_vim/subscriptions.json:/subscriptions.json
  PORTS:
  - "8080:3000"
  LINKS:
  - "influxdb:influxdb"
  IMAGE: "spacehellas/tnova-vim-backend:latest"

GRAFANA:
  NAME: grafana
  PORTS:
  - "3000:3000"
  IMAGE: "grafana/grafana:latest"
```

**File 3. - Optional** ansible_installation/roles/openstack-vm-provision/vars/main.yml:
```
# Openstack Identity URL
OS_AUTH_URL: http://10.143.0.240:5000/v2.0
# Openstack Username & Password
OS_USERNAME: admin
OS_PASSWORD: enter_password_here
# Openstack Tenant name
OS_TENANT_NAME: admin

OS_AUTH:
  auth_url: "{{ OS_AUTH_URL }}"
  username: "{{ OS_USERNAME }}"
  password: "{{ OS_PASSWORD }}"
  project_name: "{{ OS_TENANT_NAME }}"


# Openstack key pair name
KEY_NAME: os_key
# Openstack Internal network name for VM
INTERNAL_NETWORK: int-net
# Openstack Enternal network name for VM
EXTERNAL_NETWORK: ext-net
# Openstack Flavor name for VM
FLAVOR: m1.medium
# Openstack Image or Snapshot name for VM
OSIMG: trusty64cloud
# Number of instances to provision
INSTCNT: 1
# Name of instance to provision
INSTNAME: ansible-provision-vim_monitoring
```