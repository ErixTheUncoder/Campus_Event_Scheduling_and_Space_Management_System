function Approval(){
  const tempApproval = [
    { id: 1, event: 'Hackathon 2024', location: 'Main Hall', date: '2024-12-25', status: null },
    { id: 2, event: 'CS Club Meetup', location: 'Lab 3', date: '2024-12-26', status:  "Approved"},
    { id: 3, event: 'Exam Prep', location: 'Library Room A', date: '2024-12-27', status:  null},
    { id: 4, event: 'Staff Meeting', location: 'Conf Room B', date: '2024-12-28', status:  "Rejected"},
    { id: 5, event: 'Staff Meeting', location: 'Conf Room B', date: '2024-12-28', status:  null},
  ];

  function selectApproval(){
    const Approve = confirm("Do you want to approve the event?");
    if(Approve){
      //do something
    }else{
      //do something
    }
  }

  return(
    <>
      <table>
         <tr>
        <th>Event Name</th>
        <th>Location</th>
        <th>Date</th>
        <th>Status</th>
        <th></th>
      </tr>
      {tempApproval.map((req) =>
        {
          let finalStatus = "";
          if(req.status===null){
            finalStatus = "Pending";
          }else{
            finalStatus = req.status;
          }

          return(
        //function here
        <tr key={req.id}>
          <td>{req.event}</td> 
          <td>{req.location}</td> 
          <td>{req.date}</td> 
          <td>
            <span className={`badge ${finalStatus.toLowerCase()}`}>
                {finalStatus}
              </span>
              </td> 
              <td><button className="approval-btn" onClick={()=>selectApproval()}>Select</button></td>
        </tr>
          );
        }
      )
      }
      </table>
      </>
    );
}

export default Approval;