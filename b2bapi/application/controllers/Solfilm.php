<?php
require(APPPATH.'/libraries/REST_Controller.php');


class Solfilm extends REST_Controller
{
    public function __construct($config = 'rest'){
        header('Access-Control-Allow-Origin: *');
        header("Access-Control-Allow-Methods: GET, POST, OPTIONS, PUT, DELETE");
        parent::__construct();
        $this->load->database();
    }

    public function customer_get(){
        $customerId = $this->get('customerId');

        $ch = curl_init();
        $resourceUrl = "/customer/" . $customerId;
        $url = $this->baseUrl.$resourceUrl;

        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "GET");
        $headers = getRestApiHeaders();
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

        $result = curl_exec($ch);

        if (curl_errno($ch)) {
            $this->response(array("status" => "failed", "data" => curl_error($ch), "request_status" => REST_Controller::HTTP_NOT_FOUND));
        }

        $this->response(array("status" => "success", "data" => $result, "request_status" => REST_Controller::HTTP_OK));
        curl_close($ch);
    }

    public function customers_get() {
    	$getAllUsers = $this->db->query("select * from user")->result_array();
		$ch1 = curl_init();

		// based on all fetched user, we do some cleanup in the database.
		// if e.g. a user (customer contact) is removed from mobilplan, we delete the user from the Local database too
    	foreach ($getAllUsers as $user){
    		// we have a user
			$mobilPlanId = $user['mobilPlanId'];
			$customerId = $user['customerId'];
			$resourceUrl = "/customer-contacts/customer/" . $customerId;
			$url = $this->baseUrl.$resourceUrl;

			curl_setopt($ch1, CURLOPT_URL, $url);
			curl_setopt($ch1, CURLOPT_RETURNTRANSFER, 1);
			curl_setopt($ch1, CURLOPT_CUSTOMREQUEST, "GET");
			$headers = getRestApiHeaders();
			curl_setopt($ch1, CURLOPT_HTTPHEADER, $headers);

			$result = curl_exec($ch1);

			if (curl_errno($ch1)) {
				$this->response(array("status" => "failed", "data" => curl_error($ch1), "request_status" => REST_Controller::HTTP_NOT_FOUND));
			}


			if ($result == "[]") {
				$this->db->delete('user', array('mobilPlanId'=>$mobilPlanId));
				$this->db->delete('autodealers', array('mobilPlanId'=>$customerId));
			}
		}

		curl_close($ch1);
        $ch = curl_init();

        $resourceUrl = "/customers";
        $url = $this->baseUrl.$resourceUrl;

        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "GET");
        $headers = getRestApiHeaders();
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

        $result = curl_exec($ch);
        $final_result = json_decode($result, true);
        $userList = array();

        for ($x = 0; $x < count($final_result); $x++) {
            $userEmail = $final_result[$x]['email'];
            if($userEmail != 'booking@solfilm.dk') {
				$checkUser = $this->db->query("select * from user where email = '$userEmail'")->row();

				if ($checkUser) {
					if ($checkUser->status == "active" || $checkUser->status == "disable") {
						$userList[$x] = $final_result[$x];
						$userList[$x]['already'] = "yes";
						$userList[$x]['status'] = $checkUser->status;
					}
				} else {
					$userList[$x] = $final_result[$x];
					$userList[$x]['already'] = "no";
					$userList[$x]['status'] = "disable";
				}
			}
        }
        usort($userList, function ($a, $b) {
            return strcmp($a['name'], $b['name']);
        });

        if (curl_errno($ch)) {
            $this->response(array("status" => "failed", "data" => curl_error($ch), "request_status" => REST_Controller::HTTP_NOT_FOUND));
        }

        $this->response(array("status" => "success", "data" => $userList, "request_status" => REST_Controller::HTTP_OK));
        curl_close($ch);
    }

	/**
	 * Get employee from MobilPlan API that can be assigned to work with tinting and assigned to an autodealer
	 */
    public function employees_get() {
        $ch = curl_init();
        $resourceUrl = "/employees";
        $url = $this->baseUrl.$resourceUrl;

        curl_setopt($ch, CURLOPT_URL,$url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "GET");

        $headers = getRestApiHeaders();
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

        $result = curl_exec($ch);
        $final_result = json_decode($result, true);

        if (curl_errno($ch)) {
            $this->response(array("status" => "failed", "data" => curl_error($ch), "request_status" => REST_Controller::HTTP_NOT_FOUND));
        }

        $this->response(array("status" => "success", "data" => $final_result, "request_status" => REST_Controller::HTTP_OK));
        curl_close($ch);
	}

	public function materials_get(){
		$ch = curl_init();

        $resourceUrl = "/materials";
        $url = $this->baseUrl.$resourceUrl;

		curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
		curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "GET");
		$headers = getRestApiHeaders();
		curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

		$result = curl_exec($ch);

		if (curl_errno($ch)) {
			$this->response(array("status" => "failed", "data" => curl_error($ch), "request_status" => REST_Controller::HTTP_NOT_FOUND));
		}

		$final_result = json_decode($result, true);

		$carInfo = array();
        $paintInfo = array();
        $fittingInfo = array();
        $shadeInfo = array();

		$carlen = 0;
        $paintlen = 0;
        $fittinglen = 0;
        $shadelen = 0;

		for ($a = 0; $a < count($final_result); $a++) {
			$description = $final_result[$a]['description'];
            $product_no = $final_result[$a]['product_no'];
            $name = $final_result[$a]["name"];
			if ($description === "booking.models") {
                $pos = strpos($name, ',');
                if($pos !== false){
                    $data =array();
					$data['id'] = $final_result[$a]['id'];
                    $data['make'] = trim(substr($name, 0, $pos));
					$data['model'] = trim(substr($name, $pos + 1));
                    $data['product_no'] = $product_no;
                    $carInfo[$carlen] = $data;
                    $carlen++;
                }
			}

            if($description === 'booking.paintprotection'){
                $data =array();
                $data['id'] = $final_result[$a]['id'];
                $data['product_no'] = $product_no;
                $data['name'] = $name;
                $paintInfo[$paintlen] = $data;
                $paintlen++;
            }

            if($description === 'booking.edgefitting'){
                $data =array();
                $data['id'] = $final_result[$a]['id'];
                $data['product_no'] = $product_no;
                $data['name'] = $name;
                $fittingInfo[$fittinglen] = $data;
                $fittinglen++;
            }

            if($description === 'booking.shades'){
                $data =array();
                $data['id'] = $final_result[$a]['id'];
                $data['product_no'] = $product_no;
                $data['name'] = $name;
                $shadeInfo[$shadelen] = $data;
                $shadelen++;
            }
		}

		$this->response(array("status" => "success", "carData" => $carInfo, "paintData" => $paintInfo, "fittingData" => $fittingInfo, "shadeData" => $shadeInfo, "request_status" => REST_Controller::HTTP_OK));
		curl_close($ch);
	}

	public function customMaterial_get(){
		$ch = curl_init();
        $resourceUrl = "/materials";
        $url = $this->baseUrl.$resourceUrl;

		curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
		curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "GET");

		$headers = getRestApiHeaders();

		curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
		$result = curl_exec($ch);

		if (curl_errno($ch)) {
			$this->response(array("status" => "failed", "data" => curl_error($ch), "request_status" => REST_Controller::HTTP_NOT_FOUND));
		}

		curl_close($ch);

		$final_result = json_decode($result, true);

		$carInfo = array();
        $paintInfo = array();
        $windowInfo = array();
        $shadeInfo = array();

        $paintlen = 0;
        $winlen = 0;
        $shadelen = 0;

		for ($a = 0; $a < count($final_result); $a++) {
			$description = $final_result[$a]['description'];
            $product_no = $final_result[$a]['product_no'];
			$name = $final_result[$a]["name"];

			if($description === 'booking.customwindows'){
				$data =array();
                $data['id'] = $final_result[$a]['id'];
                $data['product_no'] = $product_no;
                $data['name'] = $name;
                $windowInfo[$winlen] = $data;
                $winlen++;
			}

            if($description === 'booking.paintprotection'){
                $data =array();
                $data['id'] = $final_result[$a]['id'];
                $data['product_no'] = $product_no;
                $data['name'] = $name;
                $paintInfo[$paintlen] = $data;
                $paintlen++;
            }

            if($description === 'booking.shades'){
                $data =array();
                $data['id'] = $final_result[$a]['id'];
                $data['product_no'] = $product_no;
                $data['name'] = $name;
                $shadeInfo[$shadelen] = $data;
                $shadelen++;
            }
		}

		$this->response(array("status" => "success", "carData" => $carInfo, "paintData" => $paintInfo, "windowData" => $windowInfo, "shadeData" => $shadeInfo, "request_status" => REST_Controller::HTTP_OK));

	}

    public function savedEmployees_get(){
        $ch = curl_init();

        $resourceUrl = "/employees";
        $url = $this->baseUrl.$resourceUrl;

        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "GET");
        $headers = getRestApiHeaders();
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

        $result = curl_exec($ch);

		if (curl_errno($ch)) {
			$this->response(array("status" => "failed", "data" => curl_error($ch), "request_status" => REST_Controller::HTTP_NOT_FOUND));
		}
		curl_close($ch);

		$final_result = json_decode($result, true);

        $storedEmployees = array();
        for ($a = 0; $a < count($final_result); $a++) {
            $id = $final_result[$a]['id'];
            $checkEmployee = $this->db->query("select * from employees where employeeId = '$id'")->row();
            if ($checkEmployee) {
                $data =array();
                $data['firstname'] = $final_result[$a]['firstname'];
                $data['lastname'] = $final_result[$a]['lastname'];
                $this->db->update('employees',$data,array("employeeId"=>$id));
                $storedEmployees[$a] = $final_result[$a];
                $storedEmployees[$a]['already'] = "yes";
            } else {
                $storedEmployees[$a] = $final_result[$a];
                $storedEmployees[$a]['already'] = "no";
            }
        }

        $this->response(array("status" => "success", "data" => $storedEmployees, "request_status" => REST_Controller::HTTP_OK));
    }

    public function salesman_get()
    {
        $customerId = $this->get("customerId");
		$checkUser = $this->db->query("select * from user where customerId = '$customerId' and status = 'active'")->row();
		$localDbEmployees = $this->db->query("select employeeId from employees")->result_array();
		$localDbInstallers = $this->db->query("select mobilPlanId from installers where autoDealerId = '$customerId'")->result_array();

        if ($checkUser) {
            $ch = curl_init();

            $resourceUrl = "/customer/".$customerId;
            $url = $this->baseUrl.$resourceUrl;
            curl_setopt($ch, CURLOPT_URL, $url);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
            curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "GET");
            $headers = getRestApiHeaders();
            curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
            $result = curl_exec($ch);

            if (curl_errno($ch)) {
                $this->response(array("status" => "failed", "data" => curl_error($ch), "request_status" => REST_Controller::HTTP_NOT_FOUND));
            }
            if ($result == "[]") {
                $this->response(array("status" => "failed", "data" => "User not found in MobilPlan Database", "request_status" => REST_Controller::HTTP_NOT_FOUND));
            }
            curl_close($ch);

            if($result) {
                $ch1 = curl_init();

                $resourceUrl = "/customer-contacts/customer/".$customerId;
                $url = $this->baseUrl.$resourceUrl;

                curl_setopt($ch1, CURLOPT_URL, $url);
                curl_setopt($ch1, CURLOPT_RETURNTRANSFER, 1);
                curl_setopt($ch1, CURLOPT_CUSTOMREQUEST, "GET");
                $headers = getRestApiHeaders();
                curl_setopt($ch1, CURLOPT_HTTPHEADER, $headers);

                $result1 = curl_exec($ch1);
                $salesmen = json_decode($result1, true);

                if (curl_errno($ch1)) {
                    $this->response(array("status" => "failed", "data" => curl_error($ch1), "request_status" => REST_Controller::HTTP_NOT_FOUND));
                }

                if ($result1 == "[]") {
                    $this->response(array("status" => "failed", "data" => "No Salesman for this user", "employees" => $localDbEmployees, "installers" => $localDbInstallers, "request_status" => REST_Controller::HTTP_NOT_FOUND));
                }

                curl_close($ch1);
                $this->response(array("status" => "success", "salesmen" => $salesmen, "employees" => $localDbEmployees, "installers" => $localDbInstallers, "request_status" => REST_Controller::HTTP_OK));
            }
        } else {
            $this->response(array("status" => "failed", "data" => "salesman_get - User not found in our Database", "request_status" => REST_Controller::HTTP_NOT_FOUND));
        }
	}

	public function submitOrder_post(){
        $calendarId = $this->post('calendarId');
		$timeSlotId = $this->post('timeSlotId');

		$ch = $this->getSummaryFromCalendarAPIRequest($calendarId, $timeSlotId);
		$summaryResponse = json_decode(curl_exec($ch), true);

		if (curl_errno($ch)) {
			$this->response(array("status" => "failed", "data" => curl_error($ch), "request_status" => REST_Controller::HTTP_NOT_FOUND));
		}
		curl_close($ch);

        $ch = curl_init();
		$baseUrl = getenv("REST_SERVICE_URL");
		$url = $baseUrl.'/order?calendarId='.$calendarId.'&timeSlotId='.$timeSlotId;

        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
		$data = '{"calendarId": "'.$calendarId.'", "timeSlotId":"'.$timeSlotId.'"}';
		curl_setopt($ch, CURLOPT_POSTFIELDS, $data); // I do not think this is neccessary, because the order is identified by calendardId and timeSlotId
		curl_setopt($ch, CURLOPT_POST, 1);
		$headers = array(
            'Content-Type:  application/json;charset=UTF-8'
        );

		curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
		$orderSubmitResponse = curl_exec($ch);

		if (curl_errno($ch)) {
            $this->response(array("status" => "failed", "data" => curl_error($ch), "request_status" => REST_Controller::HTTP_NOT_FOUND));
		}
		curl_close($ch);
		// when order has been submitted we send an email to Nordisk Solfilm with a summary of the order that was submitted.
		/*
		 *  API json response fields
			private String requisitionNumber;
			private String salesman;
			private String deliveryAddress;
			private String additionalComments;
			private String customMakeAndModelComment;
			private List<String> makeAndModels = new ArrayList<>();
			private List<String> edgeFittings = new ArrayList<>();
			private List<String> paintProtections = new ArrayList<>();
			private List<String> shades = new ArrayList<>();
			private List<String> customWindows = new ArrayList<>();
			private int workDuration;
			private String scheduledTime;
			private String price;
			private String cancelOrderInformation;
		 */
		$summaryData = array();
		$summaryData['requisitionNumber'] = $summaryResponse['requisitionNumber'];
		$summaryData['salesman'] = $summaryResponse['salesman'];
		$summaryData['deliveryAddress'] = $summaryResponse['deliveryAddress'];
		$summaryData['additionalComments'] = $summaryResponse['additionalComments'];
		$summaryData['customMakeAndModelComment'] = $summaryResponse['customMakeAndModelComment'];
		$summaryData['makeAndModels'] = $summaryResponse['makeAndModels'];
		$summaryData['edgeFittings'] = $summaryResponse['edgeFittings'];
		$summaryData['paintProtections'] = $summaryResponse['paintProtections'];
		$summaryData['shades'] = $summaryResponse['shades'];
		$summaryData['customWindows'] = $summaryResponse['customWindows'];
		$summaryData['workDuration'] = $summaryResponse['workDuration'];
		$summaryData['scheduledTime'] = $summaryResponse['scheduledTime'];
		$summaryData['price'] = $summaryResponse['price'];
		$summaryData['cancelOrderInformation'] = $summaryResponse['cancelOrderInformation'];

		$this->getSummaryFromCalendarAPIRequest($calendarId, $timeSlotId);
		$this->sendSummaryEmail($summaryData);
		$this->response(array("status" => "success", "data" => $orderSubmitResponse, "request_status" => REST_Controller::HTTP_OK));
	}

	/**
	 * @param array $summaryData
	 */
	public function sendSummaryEmail(array $summaryData)
	{
		$message = $this->load->view('summary', $summaryData, true);
		$from = getenv('MAIL_FROM_ADDRESS');
		$subject = 'ORDRE';
		$from_name = getenv('MAIL_FROM_NAME');
		// take the sender's 'from' address as destination address for order summaries
		$to = getenv('MAIL_FROM_ADDRESS');
		$this->smtp_email->send($from, $from_name, $to, $subject, $message);
		$this->response(array("status" => "success"));
	}

	public function orders_get(){
		$customerId = $this->get('customerId');
		$checkUser = $this->db->query("select * from user where customerId = '$customerId'")->row();

		if ($checkUser) {
			$ch = curl_init();
			$baseUrl = getenv('REST_SERVICE_URL');
			$url = $baseUrl.'/orders?customerId='.$customerId.'&language=EN';

			curl_setopt($ch, CURLOPT_URL, $url);
			curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
			curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "GET");

			$headers = array(
				'Content-Type:  application/json;charset=UTF-8'
			);

			curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
			$result = curl_exec($ch);

			if (curl_errno($ch)) {
				$this->response(array("status" => "failed", "data" => curl_error($ch), "request_status" => REST_Controller::HTTP_NOT_FOUND));
			}

			$this->response(array("status" => "success", "data" => $result, "url" => $url, "request_status" => REST_Controller::HTTP_OK));
			curl_close($ch);

		} else  {
			$this->response(array("status" => "failed", "data" => "Not found user", "request_status" => REST_Controller::HTTP_NOT_FOUND));
		}
	}

	public function summary_post(){
		$calendarId = $this->post('calendarId');
		$timeSlotId = $this->post('timeSlotId');

		$ch = $this->getSummaryFromCalendarAPIRequest($calendarId, $timeSlotId);

		$result = curl_exec($ch);

		if (curl_errno($ch)) {
            $this->response(array("status" => "failed", "data" => curl_error($ch), "request_status" => REST_Controller::HTTP_NOT_FOUND));
        }
		curl_close($ch);
		$this->response(array("status" => "success", "data" => $result, "request_status" => REST_Controller::HTTP_OK));

	}

	public function getSummaryFromCalendarAPIRequest($calendarId, $timeSlotId){
		$ch = curl_init();

		$baseUrl = getenv("REST_SERVICE_URL");
		$url = $baseUrl.'/summary?calendarId='.$calendarId.'&timeSlotId='.$timeSlotId;

		curl_setopt($ch, CURLOPT_URL, $url);
		curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
		curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "GET");

		$headers = array(
			'Content-Type:  application/json;charset=UTF-8'
		);
		curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
		return $ch;
	}

    public function createCalendar_post(){
        $language = $this->post("language");
        $year = $this->post("year");
        $weekNumber = $this->post("weekNumber");
        $materialProductNumbers = $this->post("materialProductNumbers");
        $requisitionNumber = $this->post("requisitionNumber");
        $additionalComments = $this->post("additionalComments");
        $deliveryAddress = $this->post("deliveryAddress");
        $salesmanId = $this->post("salesmanId");
        $customerId = $this->post("customerId");
        $assignedEmployees = $this->post("assignedEmployees");
		$employeesServicingAutoDealers = $this->post("employeesServicingAutoDealers");

		$data = '{"language":"'.$language.'","year":'.$year.',"weekNumber":'.$weekNumber.',"order":{"materialProductNumbers":'.$materialProductNumbers.',"requisitionNumber":"'.$requisitionNumber.'","additionalComments":"'.$additionalComments.'","deliveryAddress":"'.$deliveryAddress.'","salesmanId":"'.$salesmanId.'"},"autoDealer":{"customerId":"'.$customerId.'","assignedEmployees":'.$assignedEmployees.',"employeesServicingAutoDealers":'.$employeesServicingAutoDealers.'}}';
		$ch = curl_init();

		$baseUrl = getenv("REST_SERVICE_URL");
		$url = $baseUrl.'/calendar';

		curl_setopt($ch, CURLOPT_URL, $url);
		curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
		curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
		curl_setopt($ch, CURLOPT_POST, 1);

		$headers = array(
			'Content-Type:  application/json;charset=UTF-8'
		);

		curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

		$result = curl_exec($ch);

		if (curl_errno($ch)) {
			$this->response(array("status" => "failed", "data" => curl_error($ch), "request_status" => REST_Controller::HTTP_NOT_FOUND));
		}
		curl_close($ch);
		$this->response(array("status" => "success", "data" => $result, "request_status" => REST_Controller::HTTP_OK));
	}

	public function customOrderCreateCalendar_post(){
		$language = $this->post('language');
        $year = $this->post('year');
        $model_year = $this->post('model_year');
        $weekNumber = $this->post('weekNumber');
        $customWindows = $this->post('customWindows');
        $make = $this->post('make');
        $model = $this->post('model');
		$additionalCommentsToModel = $this->post('additionalCommentsToModel');
		$requisitionNumber = $this->post('requisitionNumber');
        $additionalComments = $this->post('additionalComments');
		$deliveryAddress = $this->post('deliveryAddress');
		$salesmanId = $this->post('salesmanId');
        $materialProductNumbers = $this->post('materialProductNumbers');
        $customerId = $this->post('customerId');
        $assignedEmployees = $this->post('assignedEmployees');
		$employeesServicingAutoDealers = $this->post('employeesServicingAutoDealers');

		$data = '{"language":"'.$language.'","year":'.$year.',"weekNumber":'.$weekNumber.',"order":{"customOrder":{"customWindows":'.$customWindows.',"make":"'.$make.'","model":"'.$model.'","year":"'.$model_year.'","additionalCommentsToModel":"'.$additionalCommentsToModel.'"},"requisitionNumber":"'.$requisitionNumber.'","additionalComments":"'.$additionalComments.'","deliveryAddress":"'.$deliveryAddress.'","salesmanId":"'.$salesmanId.'","materialProductNumbers":'.$materialProductNumbers.'},"autoDealer":{"customerId":"'.$customerId.'","assignedEmployees":'.$assignedEmployees.',"employeesServicingAutoDealers":'.$employeesServicingAutoDealers.'}}';

		$ch = curl_init();
		$baseUrl = getenv("REST_SERVICE_URL");
		$url = $baseUrl.'/calendar';

		curl_setopt($ch, CURLOPT_URL, $url);
		curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
		curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
		curl_setopt($ch, CURLOPT_POST, 1);
		$headers = array(
			'Content-Type:  application/json;charset=UTF-8'
		);

		curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
		$result = curl_exec($ch);

		if (curl_errno($ch)) {
			$this->response(array("status" => "failed", "data" => curl_error($ch), "request_status" => REST_Controller::HTTP_NOT_FOUND));
		}
		curl_close($ch);
		$this->response(array("status" => "success", "data" => $result, "request_status" => REST_Controller::HTTP_OK));
	}

    public function addCustomer_post() {
        $customerId = $this->post("customerId");
        $name = $this->post("name");
        $email = $this->post("email");
		$phone = $this->post("phone");

		$json = [
			array(
				"customer_id" => $customerId,
				"email" => $email,
				"name" => $name,
				"phone" => $phone,
				"occupation" => "string",
				"notes" => "string"
			)
		];

		$jsonData = json_encode($json);

		$resourceUrl = "/customer-contact";
		$url = $this->baseUrl.$resourceUrl;

        $ch = curl_init($url);

        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $jsonData);
		curl_setopt($ch, CURLOPT_POST, 1);

        $headers = getRestApiHeaders();

        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

		$result = curl_exec($ch);

        if (curl_errno($ch)) {
            $this->response(array("status" => "failed", "data" => curl_error($ch), "request_status" => REST_Controller::HTTP_NOT_FOUND));
        }

       $var = explode('"', $result);

        if ($var[1] == "1 customer contact added") {
			$ch1 = curl_init();

			$resourceUrl = "/customer/".$customerId;
			$url = $this->baseUrl.$resourceUrl;

			curl_setopt($ch1, CURLOPT_URL, $url);
			curl_setopt($ch1, CURLOPT_RETURNTRANSFER, 1);
			curl_setopt($ch1, CURLOPT_CUSTOMREQUEST, "GET");
			$headers = getRestApiHeaders();
			curl_setopt($ch1, CURLOPT_HTTPHEADER, $headers);

			$result1 = curl_exec($ch1);
			if (curl_errno($ch1)) {
				$this->response(array("status" => "failed", "data" => curl_error($ch1), "request_status" => REST_Controller::HTTP_NOT_FOUND));
			}

			if ($result1 == "[]") {
				$this->response(array("status" => "failed", "data" => "User not found in MobilPlan Database", "request_status" => REST_Controller::HTTP_NOT_FOUND));
			}

			curl_close($ch1);

			if($result1) {
				$ch2 = curl_init();

				$resourceUrl = "/customer-contacts/customer/".$customerId;
				$url = $this->baseUrl.$resourceUrl;

				curl_setopt($ch2, CURLOPT_URL, $url);
				curl_setopt($ch2, CURLOPT_RETURNTRANSFER, 1);
				curl_setopt($ch2, CURLOPT_CUSTOMREQUEST, "GET");
				$headers = getRestApiHeaders();
				curl_setopt($ch2, CURLOPT_HTTPHEADER, $headers);

				$result2 = curl_exec($ch2);
				$final_result = json_decode($result2, true);

				if (curl_errno($ch2)) {
					$this->response(array("status" => "failed", "data" => curl_error($ch2), "request_status" => REST_Controller::HTTP_NOT_FOUND));
				}

				if ($result1 == "[]") {
					$this->response(array("status" => "failed", "data" => "No Salesman for this user", "request_status" => REST_Controller::HTTP_NOT_FOUND));
				}

				curl_close($ch2);
				$this->response(array("status" => "success", "data" => $final_result, "request_status" => REST_Controller::HTTP_OK));
			}
        }
        curl_close($ch);
    }
}
